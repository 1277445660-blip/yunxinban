// ============================================
// 云心伴 - MongoDB 初始化脚本
// 在容器首次启动时自动执行
// ============================================

db = db.getSiblingDB('yunxinban');

// ---------- 聊天消息集合 ----------
db.createCollection('chat_messages', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['session_id', 'user_id', 'role', 'content', 'created_at'],
            properties: {
                session_id: { bsonType: 'string' },
                user_id: { bsonType: 'string' },
                role: { enum: ['user', 'assistant', 'system'] },
                content: { bsonType: 'string' },
                content_type: { enum: ['text', 'voice'] },
                sentiment_score: { bsonType: 'double' },
                crisis_flags: { bsonType: 'array' },
                encryption_version: { bsonType: 'string' },
                created_at: { bsonType: 'date' }
            }
        }
    }
});

// 索引
db.chat_messages.createIndex({ session_id: 1, created_at: 1 });
db.chat_messages.createIndex({ user_id: 1, created_at: -1 });
db.chat_messages.createIndex({ created_at: 1 }, { expireAfterSeconds: 31536000 }); // 1年后自动归档

// ---------- 会话记忆池集合 ----------
db.createCollection('session_memory', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['user_id', 'session_id', 'updated_at'],
            properties: {
                user_id: { bsonType: 'string' },
                session_id: { bsonType: 'string' },
                short_term_context: { bsonType: 'array' },
                long_term_keywords: { bsonType: 'array' },
                mood_trajectory: { bsonType: 'array' },
                updated_at: { bsonType: 'date' }
            }
        }
    }
});

db.session_memory.createIndex({ user_id: 1, session_id: 1 }, { unique: true });
db.session_memory.createIndex({ updated_at: -1 });

// ---------- 情感分析日志集合 ----------
db.createCollection('sentiment_logs');
db.sentiment_logs.createIndex({ user_id: 1, created_at: -1 });
db.sentiment_logs.createIndex({ session_id: 1 });

// ---------- 审计日志集合（MongoDB 副本，用于长期存储） ----------
db.createCollection('audit_archive');
db.audit_archive.createIndex({ created_at: 1 }, { expireAfterSeconds: 94608000 }); // 3年后过期

print('✅ 云心伴 MongoDB 初始化完成');
