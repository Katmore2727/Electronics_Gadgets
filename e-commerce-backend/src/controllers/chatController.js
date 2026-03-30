import * as chatService from '../services/chatService.js';

export const getSamples = async (req, res) => {
  res.json({
    success: true,
    data: chatService.getSampleQuestions(),
  });
};

export const stream = async (req, res, next) => {
  try {
    chatService.enforceRateLimit(req);
    await chatService.streamChatCompletion({
      req,
      res,
      message: req.body?.message,
      conversation: req.body?.conversation,
    });
  } catch (error) {
    if (res.headersSent) {
      try {
        res.write('event: error\n');
        res.write(`data: ${JSON.stringify({ message: error.message || 'Chat request failed.' })}\n\n`);
        res.end();
      } catch {
        res.end();
      }
      return;
    }

    next(error);
  }
};
