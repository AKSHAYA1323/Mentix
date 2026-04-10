const mongoose = require('mongoose');

const questionItemSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      A: { type: String, required: true, trim: true },
      B: { type: String, required: true, trim: true },
      C: { type: String, required: true, trim: true },
      D: { type: String, required: true, trim: true },
    },
    answer: {
      type: String,
      required: true,
      enum: ['A', 'B', 'C', 'D'],
    },
  },
  { _id: false }
);

const testQuestionSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
      trim: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    questions: {
      type: [questionItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'questions',
  }
);

testQuestionSchema.index({ role: 1, topic: 1 }, { unique: true });

module.exports = mongoose.model('TestQuestion', testQuestionSchema);
