require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const TestQuestion = require('../models/TestQuestion');

const inputPath = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : path.resolve(__dirname, '../data/test-questions.sample.json');

async function run() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing in backend/.env');
  }

  const raw = fs.readFileSync(inputPath, 'utf8');
  const payload = JSON.parse(raw);

  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error('Input JSON must be a non-empty array.');
  }

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  const operations = payload.map((item) => ({
    updateOne: {
      filter: {
        role: item.role,
        topic: item.topic,
      },
      update: { $set: item },
      upsert: true,
    },
  }));

  const result = await TestQuestion.bulkWrite(operations);
  console.log(`Imported ${payload.length} questions from ${inputPath}`);
  console.log(JSON.stringify(result, null, 2));
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error('Import Test Questions Error:', error.message);
  try {
    await mongoose.disconnect();
  } catch (_error) {
    // Ignore cleanup failure.
  }
  process.exit(1);
});
