import { db, accountSnapshots, positions, trades, aiReasoning, logs, botStatus } from '../db/index.js';

async function clearMockData() {
  console.log('Clearing all data...');
  
  await db.delete(aiReasoning);
  await db.delete(trades);
  await db.delete(positions);
  await db.delete(logs);
  await db.delete(accountSnapshots);
  await db.delete(botStatus);
  
  console.log('✅ All data cleared!');
}

clearMockData().catch(console.error);