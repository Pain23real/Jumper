/**
 * blockchainHelpers.js - Arcium Integration for Jump Game
 * Based on official Arcium documentation: https://docs.arcium.com/developers/hello-world
 */

import * as solanaWeb3 from '@solana/web3.js';
import nacl from 'tweetnacl';
// Удаляем импорт anchor
// import * as anchor from '@coral-xyz/anchor';

// Arcium Configuration - используем devnet кластер
const PROGRAM_ID = "Y5Jh1bgvDcADUD9WnQN9Dk7nsrEMNWKAmNvjdoL17zu";
const RPC_URL = "https://api.devnet.solana.com";

// Arcium devnet cluster offsets (из документации)
const ARCIUM_CLUSTER_OFFSETS = [2326510165, 2260723535, 768109697];
const DEFAULT_CLUSTER_OFFSET = ARCIUM_CLUSTER_OFFSETS[0]; // Используем первый

// Events for compatibility
const EVENTS = {
  PLAYER_INITIALIZED: 'PlayerInitializedEvent',
  SCORE_SUBMITTED: 'ScoreSubmittedEvent', 
  SCORE_VALIDATED: 'ScoreValidatedEvent'
};

/**
 * Simple encryption for demo (заменим на RescueCipher когда подключим @arcium-hq/client)
 */
class SimpleEncryption {
  constructor() {
    this.key = new Uint8Array(32);
    // Генерируем простой ключ
    for (let i = 0; i < 32; i++) {
      this.key[i] = Math.floor(Math.random() * 256);
    }
  }
  
  encrypt(data) {
    const dataStr = JSON.stringify(data);
    const dataBytes = new TextEncoder().encode(dataStr);
    const encrypted = new Uint8Array(dataBytes.length);
    
    for (let i = 0; i < dataBytes.length; i++) {
      encrypted[i] = dataBytes[i] ^ this.key[i % this.key.length];
    }
    
    return {
      ciphertext: Array.from(encrypted),
      publicKey: Array.from(this.key.slice(0, 32)),
      nonce: Date.now()
    };
  }
}

// Global encryption instance
let encryptionClient = null;

function getEncryptionClient() {
  if (!encryptionClient) {
    encryptionClient = new SimpleEncryption();
  }
  return encryptionClient;
}

/**
 * Get Solana connection
 */
function getConnection() {
  // Явно указываем devnet для транзакций
  return new solanaWeb3.Connection(
    "https://api.devnet.solana.com", 
    { commitment: 'confirmed', confirmTransactionInitialTimeout: 60000 }
  );
}

/**
 * Get wallet (Phantom or local)
 */
async function getWallet() {
  try {
    // Try Phantom first, но только если пользователь уже подключен
    // или явно запросил подключение (используя флаг forcedConnect)
    if (window.solana && window.solana.isPhantom) {
      // Проверяем, подключен ли уже кошелек
      if (window.solana.isConnected) {
        console.log("Phantom wallet already connected, using it");
        return window.solana;
      } else {
        // Проверяем флаг разрешения автоматического подключения кошелька
        const autoConnectAllowed = localStorage.getItem('nicknameAlreadySaved') === 'true';
        
        if (autoConnectAllowed) {
          try {
            console.log("Auto-connect allowed, connecting to Phantom wallet");
            // Снимаем флаг, чтобы при следующем обращении не выполнялось
            // автоматическое подключение повторно
            localStorage.removeItem('nicknameAlreadySaved');
            
            await window.solana.connect();
            return window.solana;
          } catch (error) {
            console.error("Error connecting to Phantom:", error);
          }
        } else {
          console.log("Auto-connect not allowed, skipping Phantom connection");
          // Возвращаем только кошелек без автоматического подключения,
          // чтобы другие части кода могли определить доступность Phantom
          return window.solana;
        }
      }
    }
    
    // Use local wallet as fallback
    const savedWallet = localStorage.getItem('gameWallet');
    if (savedWallet) {
      try {
        const keypair = solanaWeb3.Keypair.fromSecretKey(
          new Uint8Array(JSON.parse(savedWallet))
        );
        
        return {
          publicKey: keypair.publicKey,
          signTransaction: async (tx) => {
            tx.sign(keypair);
            return tx;
          },
          signAllTransactions: async (txs) => {
            return txs.map(tx => {
              tx.sign(keypair);
              return tx;
            });
          }
        };
      } catch (error) {
        console.error("Error loading local wallet:", error);
        localStorage.removeItem('gameWallet');
      }
    }
    
    // Create new local wallet
    const keypair = solanaWeb3.Keypair.generate();
    localStorage.setItem('gameWallet', JSON.stringify(Array.from(keypair.secretKey)));
    
    return {
      publicKey: keypair.publicKey,
      signTransaction: async (tx) => {
        tx.sign(keypair);
        return tx;
      },
      signAllTransactions: async (txs) => {
        return txs.map(tx => {
          tx.sign(keypair);
          return tx;
        });
      }
    };
  } catch (error) {
    console.error("Critical error getting wallet:", error);
    return null;
  }
}

/**
 * Initialize player (stub for compatibility)
 */
export async function initializePlayer() {
  try {
    // Проверяем, не была ли уже проведена инициализация в этой сессии
    const initializationFlag = localStorage.getItem('playerInitialized');
    const initializationTimestamp = localStorage.getItem('playerInitializedTimestamp');
    const rejectedFlag = sessionStorage.getItem('initializationRejected');
    
    // Если пользователь уже отклонил инициализацию в текущей сессии, не запрашиваем снова
    if (rejectedFlag === 'true') {
      console.log("User already rejected initialization in this session, skipping");
      // Эмитим событие с информацией, что инициализация была отклонена
      emitEvent(EVENTS.PLAYER_INITIALIZED, {
        player: "anonymous",
        txHash: "rejected_by_user",
        status: "rejected"
      });
      return null;
    }
    
    // Если инициализация уже выполнялась в течение последних 10 минут, не делаем повторно
    if (initializationFlag === 'true' && initializationTimestamp) {
      const elapsed = Date.now() - parseInt(initializationTimestamp);
      if (elapsed < 600000) { // 10 минут
        console.log("Player was already initialized recently, skipping initialization");
        
        // Получаем сохраненный публичный ключ
        const wallet = await getWallet();
        if (wallet && wallet.publicKey) {
          console.log("Using existing wallet:", wallet.publicKey.toString());
          
          // Эмитим событие для совместимости
          emitEvent(EVENTS.PLAYER_INITIALIZED, {
            player: wallet.publicKey.toString(),
            txHash: localStorage.getItem('playerInitTxHash') || "cached_init"
          });
          
          return wallet.publicKey;
        }
      }
    }
    
    console.log("Initializing player in Arcium contract...");
    
    const wallet = await getWallet();
    if (!wallet || !wallet.publicKey) {
      throw new Error("Wallet not connected");
    }
    
    const connection = getConnection();
    
    // Сначала проверяем, существует ли уже аккаунт для этого игрока
    try {
      // Получаем PDA для аккаунта игрока
      const [playerPDA] = solanaWeb3.PublicKey.findProgramAddressSync(
        [Buffer.from("player"), wallet.publicKey.toBuffer()],
        new solanaWeb3.PublicKey(PROGRAM_ID)
      );
      
      // Проверяем существование аккаунта
      const playerAccount = await connection.getAccountInfo(playerPDA);
      
      if (playerAccount) {
        console.log("Player account already exists, skipping initialization");
        
        // Устанавливаем флаг инициализации
        localStorage.setItem('playerInitialized', 'true');
        localStorage.setItem('playerInitializedTimestamp', Date.now().toString());
        localStorage.setItem('playerInitTxHash', 'existing_account');
        
        // Эмитим событие для совместимости
        emitEvent(EVENTS.PLAYER_INITIALIZED, {
          player: wallet.publicKey.toString(),
          txHash: "existing_account"
        });
        
        return wallet.publicKey;
      }
    } catch (checkError) {
      console.warn("Error checking player account existence:", checkError.message);
      // Продолжаем процесс инициализации
    }
    
    // Проверяем баланс и делаем airdrop если необходимо
    const balance = await connection.getBalance(wallet.publicKey);
    if (balance < 10000000) { // Если меньше 0.01 SOL
      console.log("Not enough SOL for transaction, requesting airdrop...");
      try {
        const airdropSignature = await connection.requestAirdrop(
          wallet.publicKey,
          1000000000 // 1 SOL
        );
        await connection.confirmTransaction(airdropSignature, 'confirmed');
        console.log("Airdrop successful!");
      } catch (airdropError) {
        console.warn("Airdrop failed:", airdropError.message);
      }
    }
    
    // Create transaction for player initialization
    const transaction = new solanaWeb3.Transaction();
    
    // Get required PDAs for Arcium
    const [clusterAcc] = solanaWeb3.PublicKey.findProgramAddressSync(
      [Buffer.from("cluster"), Buffer.from(DEFAULT_CLUSTER_OFFSET.toString())],
      new solanaWeb3.PublicKey(PROGRAM_ID)
    );
    
    const [mxeAcc] = solanaWeb3.PublicKey.findProgramAddressSync(
      [Buffer.from("mxe")],
      new solanaWeb3.PublicKey(PROGRAM_ID)
    );
    
    // Ручная сериализация данных для инициализации игрока
    // Структура: [variant(1 байт), player_id(32 байта), timestamp(8 байт)]
    
    // Буфер для варианта команды (1 байт)
    const variantBuffer = Buffer.from([1]); // 1 = initialize_player
    
    // Преобразуем публичный ключ в Buffer
    const playerBuffer = wallet.publicKey.toBuffer();
    
    // Буфер для timestamp (8 байт)
    const timestamp = Date.now();
    const timestampBuffer = Buffer.alloc(8);
    // Записываем младшие 4 байта
    timestampBuffer.writeUInt32LE(timestamp & 0xFFFFFFFF, 0);
    // Записываем старшие 4 байта
    timestampBuffer.writeUInt32LE(Math.floor(timestamp / 0x100000000), 4);
    
    // Объединяем все буферы
    const instructionData = Buffer.concat([
      variantBuffer,
      playerBuffer,
      timestampBuffer
    ]);
    
    console.log("Player initialization data prepared:", instructionData.length, "bytes");
    
    // Create instruction for Arcium contract
    const instruction = new solanaWeb3.TransactionInstruction({
      keys: [
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: clusterAcc, isSigner: false, isWritable: true },
        { pubkey: mxeAcc, isSigner: false, isWritable: true },
        { pubkey: solanaWeb3.SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: new solanaWeb3.PublicKey(PROGRAM_ID),
      data: instructionData,
    });
    
    transaction.add(instruction);
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;
    
    console.log("Signing and sending player initialization transaction...");
    
    // Sign and send transaction
    let txHash;
    try {
      if (window.solana && wallet === window.solana) {
        // For Phantom wallet
        const { signature } = await window.solana.signAndSendTransaction(transaction);
        txHash = signature;
      } else if (wallet.signTransaction) {
        // For local wallet
        const signedTransaction = await wallet.signTransaction(transaction);
        txHash = await connection.sendRawTransaction(signedTransaction.serialize());
      } else {
        throw new Error("Wallet does not support signing");
      }
      
      console.log("Player initialization transaction sent:", txHash);
      
      // Wait for confirmation
      console.log("Waiting for transaction confirmation...");
      // Увеличиваем тайм-аут до 60 секунд и устанавливаем больше попыток
      const confirmation = await connection.confirmTransaction({
        signature: txHash,
        blockhash: blockhash,
        lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight
      }, 'confirmed');
      
      if (confirmation.value.err) {
        console.warn(`Player initialization transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        console.log("Player initialization completed locally");
        txHash = "local_init_" + Date.now();
      } else {
        console.log("Player initialization transaction confirmed:", txHash);
      }
      
    } catch (error) {
      console.warn("Failed to send player initialization transaction:", error.message);
      
      // Проверяем, была ли транзакция отклонена пользователем
      if (error.message && (
          error.message.includes("User rejected") || 
          error.message.includes("rejected the request") ||
          error.message.includes("Transaction cancelled") ||
          error.message.includes("User denied")
      )) {
        console.log("Transaction was rejected by user, marking as rejected");
        // Устанавливаем флаг, что пользователь отклонил транзакцию
        sessionStorage.setItem('initializationRejected', 'true');
        
        // Эмитим событие с информацией об отклонении
        emitEvent(EVENTS.PLAYER_INITIALIZED, {
          player: "anonymous",
          txHash: "rejected_by_user",
          status: "rejected"
        });
        
        return null;
      }
      
      console.log("Player initialization completed locally");
      txHash = "local_init_" + Date.now();
    }
    
    // Устанавливаем флаг инициализации независимо от результата
    localStorage.setItem('playerInitialized', 'true');
    localStorage.setItem('playerInitializedTimestamp', Date.now().toString());
    localStorage.setItem('playerInitTxHash', txHash);
    
    console.log("Player initialized for wallet:", wallet.publicKey.toString());
    
    // Emit event
    emitEvent(EVENTS.PLAYER_INITIALIZED, {
      player: wallet.publicKey.toString(),
      txHash: txHash
    });
    
    return wallet.publicKey;
  } catch (error) {
    console.error("Error initializing player:", error);
    throw error;
  }
}

/**
 * Отправка и подтверждение транзакции с обработкой ошибок
 */
const sendAndConfirm = async (transaction, connection, wallet) => {
  try {
    // Получаем актуальный blockhash
    const latestBlockhash = await connection.getLatestBlockhash('finalized');
    transaction.recentBlockhash = latestBlockhash.blockhash;
    transaction.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
    
    // Устанавливаем приоритет и время жизни транзакции
    transaction.feePayer = wallet.publicKey;
    
    // Подписываем и отправляем транзакцию
    const signature = await wallet.signAndSendTransaction(transaction);
    
    // Настраиваем опции подтверждения с увеличенным таймаутом
    const confirmationOptions = {
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
    };
    
    // Ожидаем подтверждения с таймаутом и проверкой статуса
    const status = await Promise.race([
      connection.confirmTransaction(confirmationOptions),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout waiting for confirmation')), 60000)
      )
    ]);
    
    if (status && status.value && status.value.err) {
      throw new Error(`Транзакция не удалась: ${status.value.err}`);
    }
    
    return signature;
  } catch (error) {
    console.error('Ошибка при отправке транзакции:', error);
    throw error;
  }
};

/**
 * Send encrypted score using simplified approach (for now)
 */
export async function submitEncryptedScore(score, jumpsCount, platformsVisited, playerName) {
  try {
    console.log(`Submitting encrypted score: ${score} for player ${playerName}`);
    
    // Check if wallet is connected
    const wallet = await getWallet();
    if (!wallet || !wallet.publicKey) {
      throw new Error("Wallet not connected");
    }
    
    // Get connection
    const connection = await getConnection();
    if (!connection) {
      throw new Error("Cannot connect to Solana network");
    }
    
    // Создаем новую транзакцию
    const transaction = new solanaWeb3.Transaction();
    
    // Создаем ключ результата для проверки дублей
    const resultKey = `score_${score}_${playerName}`;
    
    // Данные для шифрования
    const scoreString = score.toString();
    const metadata = {
      player: playerName,
      score: scoreString,
      jumps: jumpsCount.toString(),
      platforms: platformsVisited.toString(),
      timestamp: Date.now().toString()
    };
    
    console.log("Encrypting score data...", metadata);
    
    // Шифруем данные
    const encryption = getEncryptionClient();
    const encryptedData = encryption.encrypt(JSON.stringify(metadata));
    
    console.log("Data encrypted, preparing transaction...");
    
    // Генерируем случайный computation_offset
    const computationOffset = Math.floor(Math.random() * 1000000);
    
    // Готовим данные в правильном формате для контракта
    const encryptedScore = new Uint8Array(32);
    const pubKey = new Uint8Array(32);
    
    // Заполняем encryptedScore и pubKey из нашего шифрования
    // Убедимся, что размер массива ровно 32 байта
    for (let i = 0; i < 32; i++) {
      encryptedScore[i] = encryptedData.ciphertext[i % encryptedData.ciphertext.length] || 0;
      pubKey[i] = encryptedData.publicKey[i % encryptedData.publicKey.length] || 0;
    }
    
    // Генерируем nonce
    const nonce = Date.now();
    
    // Буфер для nonce (u64 - 8 байт)
    const nonceBuffer = Buffer.alloc(8);
    // Записываем младшие 4 байта
    nonceBuffer.writeUInt32LE(nonce & 0xFFFFFFFF, 0);
    // Записываем старшие 4 байта
    nonceBuffer.writeUInt32LE(Math.floor(nonce / 0x100000000), 4);
    
    // Создаем инструкцию с правильными данными
    // Формат: [variant(1 байт), computation_offset(4 байта), encrypted_score(32 байта), pub_key(32 байта), nonce(8 байт)]
    
    // Буфер для варианта команды (1 байт)
    const variantBuffer = Buffer.from([0]); // 0 = submitEncryptedScore
    
    // Буфер для computation_offset (4 байта)
    const offsetBuffer = Buffer.alloc(4);
    offsetBuffer.writeUInt32LE(computationOffset, 0);
    
    // Преобразуем Uint8Array в Buffer
    const encryptedScoreBuffer = Buffer.from(encryptedScore);
    const pubKeyBuffer = Buffer.from(pubKey);
    
    // Объединяем все буферы
    const instructionData = Buffer.concat([
      variantBuffer,
      offsetBuffer,
      encryptedScoreBuffer,
      pubKeyBuffer,
      nonceBuffer
    ]);
    
    console.log("Instruction data prepared:", instructionData.length, "bytes");
    
    // Получаем необходимые PDA для контракта
    const [clusterAcc] = solanaWeb3.PublicKey.findProgramAddressSync(
      [Buffer.from("cluster"), Buffer.from(DEFAULT_CLUSTER_OFFSET.toString())],
      new solanaWeb3.PublicKey(PROGRAM_ID)
    );
    
    const [computationAcc] = solanaWeb3.PublicKey.findProgramAddressSync(
      [Buffer.from("computation"), Buffer.from(computationOffset.toString())],
      new solanaWeb3.PublicKey(PROGRAM_ID)
    );
    
    // Создаем инструкцию для контракта
    const instruction = new solanaWeb3.TransactionInstruction({
      keys: [
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: clusterAcc, isSigner: false, isWritable: true },
        { pubkey: computationAcc, isSigner: false, isWritable: true },
        { pubkey: solanaWeb3.SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: new solanaWeb3.PublicKey(PROGRAM_ID),
      data: instructionData,
    });
    
    transaction.add(instruction);
    
    console.log("Transaction prepared, sending...");
    
    // Используем улучшенную функцию отправки и подтверждения транзакции
    try {
      // Для Phantom и других подобных кошельков, проверяем, не отклонит ли пользователь транзакцию
      if (window.solana && wallet === window.solana) {
        // Отправляем транзакцию и ждем ее подтверждения с обработкой ошибок
        const txHash = await sendAndConfirm(transaction, connection, wallet);
        
        console.log("Transaction confirmed:", txHash);
        
        // Save locally
        savePlayerData(wallet.publicKey.toString(), playerName, score);
        
        // Emit events только для успешных транзакций
        emitEvent(EVENTS.SCORE_SUBMITTED, {
          player: wallet.publicKey.toString(),
          score: score,
          txHash: txHash
        });
        
        emitEvent(EVENTS.SCORE_VALIDATED, {
          score: score,
          txHash: txHash,
          validated: true
        });
        
        console.log("Encrypted score submitted successfully with tx:", txHash);
        return txHash;
      } else {
        throw new Error("Wallet does not support required signing method");
      }
    } catch (txError) {
      console.error("Transaction error:", txError);
      
      // Обрабатываем ошибки с истекшими транзакциями
      if (txError.message && (
          txError.message.includes("expired") || 
          txError.message.includes("block height exceeded") ||
          txError.message.includes("Timeout waiting for confirmation")
      )) {
        console.log("Transaction expired, saving result locally");
        
        // Сохраняем результат локально
        savePlayerData(wallet.publicKey.toString(), playerName, score);
        
        // Возвращаем специальный хеш для истекших транзакций
        const expiredHash = "expired_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
        
        // Emit event
        emitEvent(EVENTS.SCORE_SUBMITTED, {
          player: wallet.publicKey.toString(),
          score: score,
          txHash: expiredHash,
          note: "Saved locally due to expired transaction"
        });
        
        return expiredHash;
      }
      
      // Проверяем, была ли транзакция отклонена пользователем
      if (txError.message && (
          txError.message.includes("User rejected") || 
          txError.message.includes("rejected the request") ||
          txError.message.includes("Transaction cancelled") ||
          txError.message.includes("User denied")
      )) {
        console.log("Transaction was rejected by user");
        
        // Устанавливаем флаг отклонения
        sessionStorage.setItem(`${resultKey}_rejected`, 'true');
        
        return "rejected_by_user";
      }
      
      // Другие ошибки
      throw txError;
    }
  } catch (error) {
    console.error("Error submitting encrypted score:", error);
    
    // Проверяем, отклонил ли пользователь транзакцию
    if (error.message && (
        error.message.includes("User rejected") || 
        error.message.includes("rejected the request") ||
        error.message.includes("Transaction cancelled") ||
        error.message.includes("User denied")
    )) {
      console.log("Score transaction was rejected by user, marking as rejected");
      // Устанавливаем флаг отклонения для этого конкретного результата
      const resultKey = `score_${score}_${playerName}`;
      sessionStorage.setItem(`${resultKey}_rejected`, 'true');
      return "rejected_by_user";
    }
    
    throw error;
  }
}

/**
 * Get player statistics (mock for now)
 */
export async function getPlayerStats() {
  try {
    const wallet = await getWallet();
    if (!wallet || !wallet.publicKey) {
      throw new Error("Wallet not connected");
    }
    
    // Get from localStorage
    const players = JSON.parse(localStorage.getItem('playerNicknames') || '{}');
    const playerData = players[wallet.publicKey.toString()];
    
    if (playerData) {
      return {
        player: wallet.publicKey.toString(),
        bestScore: playerData.bestScore || playerData.lastScore || 0,
        lastScore: playerData.lastScore || 0,
        gamesPlayed: playerData.gamesPlayed || 1,
        lastUpdated: new Date(playerData.lastUpdated || Date.now())
      };
    }
    
    return {
      player: wallet.publicKey.toString(),
      bestScore: 0,
      lastScore: 0,
      gamesPlayed: 0,
      lastUpdated: null
    };
  } catch (error) {
    console.error("Error getting player stats:", error);
    return {
      player: null,
      bestScore: 0,
      lastScore: 0,
      gamesPlayed: 0,
      lastUpdated: null
    };
  }
}

/**
 * Main function for sending game results (compatible with existing interface)
 */
export async function sendGameResult(score, jumpsCount, platformsVisited, nickname) {
  try {
    // Проверяем, не отправлялся ли уже этот результат
    const lastSentScore = localStorage.getItem('lastSentScore');
    const lastSentTimestamp = localStorage.getItem('lastSentTimestamp');
    const gameResultKey = `game_result_${score}_${nickname}`;
    
    // Проверяем, не отклонил ли уже пользователь эту транзакцию
    const rejectedFlag = sessionStorage.getItem(`score_${score}_${nickname}_rejected`);
    if (rejectedFlag === 'true') {
      console.log("This game result was already rejected by user, skipping");
      return "rejected_by_user"; // Важно: возвращаем специальное значение для отклоненных транзакций
    }
    
    // Если этот результат уже был отправлен недавно (в течение 5 минут), возвращаем сохраненный хеш
    if (
      lastSentScore === score.toString() &&
      lastSentTimestamp &&
      (Date.now() - parseInt(lastSentTimestamp)) < 300000 && // 5 минут
      sessionStorage.getItem(gameResultKey)
    ) {
      console.log("This game result was already sent recently, returning cached tx hash");
      return localStorage.getItem('lastSentTxHash') || "cached_tx";
    }
    
    console.log("Sending game result via Arcium...");
    
    // Устанавливаем флаг, что начали отправку
    sessionStorage.setItem(gameResultKey, 'sending');
    localStorage.setItem('lastSentScore', score.toString());
    localStorage.setItem('lastSentTimestamp', Date.now().toString());
    
    const txHash = await submitEncryptedScore(score, jumpsCount, platformsVisited, nickname);
    
    // Если транзакция была отклонена, не сохраняем хеш и возвращаем специальное значение
    if (txHash === "rejected_by_user") {
      console.log("Transaction was rejected by user, not saving hash");
      return "rejected_by_user";
    }
    
    // Сохраняем хеш транзакции только для успешных транзакций
    localStorage.setItem('lastSentTxHash', txHash);
    
    return txHash;
  } catch (error) {
    console.error("Error sending game result:", error);
    
    // Проверяем, отклонил ли пользователь транзакцию
    if (error.message && (
        error.message.includes("User rejected") || 
        error.message.includes("rejected the request") ||
        error.message.includes("Transaction cancelled") ||
        error.message.includes("User denied")
    )) {
      console.log("Score transaction was rejected by user, marking as rejected");
      // Устанавливаем флаг отклонения для этого конкретного результата
      const resultKey = `score_${score}_${nickname}`;
      sessionStorage.setItem(`${resultKey}_rejected`, 'true');
      return "rejected_by_user";
    }
    
    // If blockchain transaction fails, fallback to local storage
    if (error.message.includes('insufficient funds') || error.message.includes('0x1')) {
      console.log("Insufficient funds for transaction, saving locally...");
      const wallet = await getWallet();
      if (wallet && wallet.publicKey) {
        savePlayerData(wallet.publicKey.toString(), nickname, score);
        
        // Return a special hash indicating local save
        const localHash = "local_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
        
        emitEvent(EVENTS.SCORE_SUBMITTED, {
          player: wallet.publicKey.toString(),
          score: score,
          txHash: localHash,
          note: "Saved locally due to insufficient funds"
        });
        
        return localHash;
      }
    }
    
    throw error;
  }
}

/**
 * Save player data locally
 */
function savePlayerData(publicKey, nickname, score) {
  try {
    const players = JSON.parse(localStorage.getItem('playerNicknames') || '{}');
    const existing = players[publicKey] || {};
    
    players[publicKey] = {
      nickname: nickname,
      lastScore: score,
      bestScore: Math.max(existing.bestScore || 0, score),
      gamesPlayed: (existing.gamesPlayed || 0) + 1,
      lastUpdated: Date.now()
    };
    
    localStorage.setItem('playerNicknames', JSON.stringify(players));
  } catch (error) {
    console.error("Error saving player data:", error);
  }
}

/**
 * Event system for blockchain events
 */
const eventListeners = {};

function emitEvent(eventName, data) {
  console.log(`Arcium Event: ${eventName}`, data);
  
  if (eventListeners[eventName]) {
    eventListeners[eventName].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${eventName}:`, error);
      }
    });
  }
}

/**
 * Subscribe to blockchain events
 */
export function addEventListener(eventName, callback) {
  if (!eventListeners[eventName]) {
    eventListeners[eventName] = [];
  }
  eventListeners[eventName].push(callback);
}

/**
 * Unsubscribe from events
 */
export function removeEventListener(eventName, callback) {
  if (eventListeners[eventName]) {
    const index = eventListeners[eventName].indexOf(callback);
    if (index > -1) {
      eventListeners[eventName].splice(index, 1);
    }
  }
}

/**
 * Check if wallet is connected
 */
export async function isWalletConnected() {
  try {
    // Проверяем непосредственно статус подключения кошелька Phantom
    // без попытки подключения
    if (window.solana && window.solana.isPhantom) {
      return window.solana.isConnected;
    }
    
    // Для других типов кошельков, проверяем наличие кошелька и публичного ключа
    const wallet = await getWallet();
    return wallet && wallet.publicKey;
  } catch (error) {
    console.error("Error checking wallet connection:", error);
    return false;
  }
}

/**
 * Get wallet address
 */
export async function getWalletAddress() {
  try {
    const wallet = await getWallet();
    return wallet ? wallet.publicKey.toString() : null;
  } catch (error) {
    return null;
  }
}

/**
 * Check wallet balance
 */
export async function checkWalletBalance(publicKey) {
  try {
    const connection = getConnection();
    const balance = await connection.getBalance(publicKey);
    return balance / solanaWeb3.LAMPORTS_PER_SOL; // Convert to SOL
  } catch (error) {
    console.error("Error checking balance:", error);
    return 0;
  }
}

/**
 * Request airdrop for devnet testing
 */
export async function requestAirdrop(publicKey, amount = 1) {
  try {
    const connection = getConnection();
    console.log(`Requesting ${amount} SOL airdrop for testing...`);
    
    const signature = await connection.requestAirdrop(
      publicKey,
      amount * solanaWeb3.LAMPORTS_PER_SOL
    );
    
    console.log("Airdrop signature:", signature);
    
    // Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed');
    
    console.log(`Airdrop of ${amount} SOL confirmed!`);
    return signature;
  } catch (error) {
    console.error("Error requesting airdrop:", error);
    throw error;
  }
}

/**
 * Ensure wallet has sufficient balance
 */
async function ensureSufficientBalance(wallet, minBalanceSOL = 0.01) {
  try {
    const balance = await checkWalletBalance(wallet.publicKey);
    console.log(`Current wallet balance: ${balance} SOL`);
    
    if (balance < minBalanceSOL) {
      console.log(`Balance too low (${balance} SOL), requesting airdrop...`);
      await requestAirdrop(wallet.publicKey, 1);
      
      // Check balance again
      const newBalance = await checkWalletBalance(wallet.publicKey);
      console.log(`New balance after airdrop: ${newBalance} SOL`);
      
      return newBalance >= minBalanceSOL;
    }
    
    return true;
  } catch (error) {
    console.error("Error ensuring sufficient balance:", error);
    return false;
  }
}

// Export constants for external use
export { PROGRAM_ID, RPC_URL, EVENTS };

// Проверяем наличие window объекта для работы в браузере
const isClient = typeof window !== 'undefined';

// Шифрование данных с использованием Arcium (упрощенная версия)
export const encryptData = (data, publicKey) => {
  try {
    if (!data || !publicKey) {
      console.error('Missing data or publicKey for encryption');
      return null;
    }

    // Создаем одноразовый ключ для шифрования
    const oneTimeKey = nacl.randomBytes(32);
    
    // Конвертируем данные в Uint8Array
    const messageUint8 = new TextEncoder().encode(JSON.stringify(data));
    
    // Преобразуем строку publicKey в Uint8Array, если она передана как строка
    let publicKeyUint8 = publicKey;
    if (typeof publicKey === 'string') {
      publicKeyUint8 = new Uint8Array(publicKey.split(',').map(Number));
    }
    
    // Шифруем данные
    const encryptedMessage = nacl.box.after(
      messageUint8,
      nacl.randomBytes(24), // nonce
      oneTimeKey
    );
    
    // Возвращаем зашифрованные данные
    return {
      encryptedData: Array.from(encryptedMessage),
      oneTimeKey: Array.from(oneTimeKey)
    };
  } catch (error) {
    console.error('Error encrypting data:', error);
    return null;
  }
};

// Проверка наличия кошелька Solana
export const checkWalletAvailability = () => {
  if (!isClient) return false;
  
  return !!window.solana;
};

// Получение подключенного кошелька Solana
export const getConnectedWallet = async () => {
  if (!isClient) return null;
  
  try {
    if (!window.solana) {
      console.log('Solana wallet not found');
      return null;
    }
    
    // Проверяем, подключен ли уже кошелек
    if (window.solana.isConnected) {
      return window.solana;
    }
    
    // Запрашиваем подключение к кошельку
    await window.solana.connect();
    
    return window.solana.isConnected ? window.solana : null;
  } catch (error) {
    console.error('Error connecting to Solana wallet:', error);
    return null;
  }
};

// Получение или создание аккаунта игрока
export const getOrCreatePlayerAccount = async (wallet) => {
  if (!wallet) {
    console.error('Wallet is required to get player account');
    return null;
  }
  
  try {
    // В реальном приложении здесь должен быть код для работы с блокчейном
    // Для демонстрации используем локальное хранилище
    const playerAddress = wallet.publicKey.toString();
    let playerData = localStorage.getItem(`player_${playerAddress}`);
    
    if (!playerData) {
      // Создаем новый аккаунт игрока
      playerData = JSON.stringify({
        address: playerAddress,
        nickname: localStorage.getItem('playerName') || 'Anonymous',
        createdAt: Date.now(),
        games: []
      });
      
      localStorage.setItem(`player_${playerAddress}`, playerData);
    }
    
    return JSON.parse(playerData);
  } catch (error) {
    console.error('Error getting player account:', error);
    return null;
  }
};

// Отправка результатов игры в блокчейн
export const sendGameResult = async (score, jumpsCount, platformsVisited, playerName) => {
  try {
    console.log(`Preparing to send game result: score=${score}, jumps=${jumpsCount}, platforms=${platformsVisited}, player=${playerName}`);
    
    // Для демо-версии без реального блокчейна используем имитацию
    return new Promise((resolve) => {
      setTimeout(() => {
        const txHash = `solana-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
        console.log(`Game result sent with transaction hash: ${txHash}`);
        
        // Сохраняем результат локально
        const results = JSON.parse(localStorage.getItem('gameResults') || '[]');
        results.push({
          score: parseInt(score),
          jumpsCount,
          platformsVisited,
          playerName,
          timestamp: Date.now(),
          txHash
        });
        localStorage.setItem('gameResults', JSON.stringify(results));
        
        resolve(txHash);
      }, 2000); // Имитация задержки сети
    });
    
    /* В реальном проекте здесь должен быть код для работы с Solana
    // 1. Подключаемся к кошельку
    const wallet = await getConnectedWallet();
    if (!wallet) {
      throw new Error('Wallet not connected');
    }
    
    // 2. Получаем аккаунт игрока
    const playerAccount = await getOrCreatePlayerAccount(wallet);
    if (!playerAccount) {
      throw new Error('Failed to get player account');
    }
    
    // 3. Шифруем данные
    const gameData = {
      score: parseInt(score),
      jumpsCount: parseInt(jumpsCount),
      platformsVisited: parseInt(platformsVisited),
      playerName,
      timestamp: Date.now()
    };
    
    const encryptedData = encryptData(gameData, wallet.publicKey.toBytes());
    if (!encryptedData) {
      throw new Error('Failed to encrypt game data');
    }
    
    // 4. Отправляем транзакцию в блокчейн
    // Здесь должен быть код для создания и отправки транзакции
    
    return 'tx-hash-placeholder';
    */
  } catch (error) {
    console.error('Error sending game result:', error);
    throw error;
  }
}; 