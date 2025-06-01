const { check } = require('express-validator');

exports.createConversationValidator = [
  check('participants', 'Participants are required').notEmpty(),
  check('participants.*', 'Invalid participant ID').isMongoId(),
  check('title', 'Title must be a string').optional().isString(),
  check('isGroup', 'isGroup must be a boolean').optional().isBoolean(),
  check('groupId', 'Group ID must be valid MongoDB ID')
    .if((value, { req }) => req.body.isGroup)
    .notEmpty()
    .isMongoId(),
  check('tags', 'Tags must be an array of strings').optional().isArray(),
  check('tags.*', 'Tag must be a string').optional().isString()
];

exports.updateConversationValidator = [
  check('title', 'Title must be a string').optional().isString(),
  check('tags', 'Tags must be an array of strings').optional().isArray(),
  check('tags.*', 'Tag must be a string').optional().isString(),
  check('isShared', 'isShared must be a boolean').optional().isBoolean()
];