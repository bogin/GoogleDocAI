const cacheService = require('./cache.service');
const BaseOpenAIService = require('./open-ai.abstract.service');

class OpenAIAnalyticsService extends BaseOpenAIService {
  systemPrompt = `
  You are a SQL query generator for a database related to files, users, owners, and permissions. 
Generate valid Sequelize query objects for the following schemas and rules.

**Schemas:**
- File:
- id: string (primary key)
- name: text
- mimeType: string
- iconLink: string
- webViewLink: string
- size: string
- shared: boolean
- trashed: boolean
- createdTime: timestamp
- modifiedTime: timestamp
- version: string
- permissions: JSONB (array of permissions with fields: id, role, type, emailAddress, displayName)
- capabilities: JSONB
- syncStatus: string
- lastSyncAttempt: timestamp
- metadata: JSONB
- userId: integer (foreign key to User)

migration: 
up: async (queryInterface, Sequelize) => {
  await queryInterface.createTable('files', {
    id: {
      type: Sequelize.STRING,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    mime_type: {
      type: Sequelize.STRING
    },
    icon_link: {
      type: Sequelize.STRING
    },
    web_view_link: {
      type: Sequelize.STRING
    },
    size: {
      type: Sequelize.STRING
    },
    shared: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    trashed: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    created_time: {
      type: Sequelize.DATE
    },
    modified_time: {
      type: Sequelize.DATE
    },
    version: {
      type: Sequelize.STRING
    },
    last_modifying_user: {
      type: Sequelize.JSONB
    },
    permissions: {
      type: Sequelize.JSONB
    },
    capabilities: {
      type: Sequelize.JSONB
    },
    sync_status: {
      type: Sequelize.STRING,
      defaultValue: 'pending'
    },
    last_sync_attempt: {
      type: Sequelize.DATE
    },
    error_log: {
      type: Sequelize.JSONB
    },
    metadata: {
      type: Sequelize.JSONB
    },
    created_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    deleted_at: {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null
    }
  });

  // Add useful indexes
  await queryInterface.addIndex('files', ['sync_status']);
  await queryInterface.addIndex('files', ['modified_time']);
  await queryInterface.addIndex('files', ['trashed']);
  await queryInterface.addIndex('files', ['mime_type']);
},
- User:
- id: integer (primary key)
- permissionId: string
- email: string
- displayName: string
- photoLink: string
- totalFiles: integer
- totalSize: bigint
migration: 
up: async (queryInterface, Sequelize) => {
  await queryInterface.createTable('users', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    permission_id: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false
    },
    email: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false
    },
    display_name: {
      type: Sequelize.STRING,
      allowNull: true
    },
    photo_link: {
      type: Sequelize.STRING,
      allowNull: true
    },
    total_files: {
      type: Sequelize.INTEGER,
      defaultValue: 0
    },
    total_size: {
      type: Sequelize.BIGINT,
      defaultValue: 0
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false
    }
  });

  // Add indexes
  await queryInterface.addIndex('users', ['email']);
  await queryInterface.addIndex('users', ['permission_id']);

  // Add foreign key to files table
  await queryInterface.addColumn('files', 'user_id', {
    type: Sequelize.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  });
},

- FileOwner:
- fileId: string (foreign key to File)
- userId: integer (foreign key to User)
- permissionRole: string

  up: async (queryInterface, Sequelize) => {
  await queryInterface.createTable('file_owners', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER
    },
    file_id: {
      type: Sequelize.STRING,
      allowNull: false,
      references: {
        model: 'files',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    permission_role: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'reader'
    },
    created_at: {
      allowNull: false,
      type: Sequelize.DATE
    },
    updated_at: {
      allowNull: false,
      type: Sequelize.DATE
    }
  });

  await queryInterface.addIndex('file_owners', ['file_id', 'user_id'], {
    unique: true,
    name: 'file_owner_unique'
  });
},

**Rules:**
1. Always use Sequelize operators ("Op.contains", "Op.and", "Op.or", etc.) for queries.
2. For nested queries, use "include" to join models ("File", "User", "FileOwner").
3. Translate user-friendly terms (e.g., "username") into schema fields (e.g., "displayName").
4. For JSONB queries, use "Op.contains" for exact matches and "Op.jsonPath" for more advanced queries.
5. Ensure queries are related to files, users, file owners, and permissions.
6. Retrieve all data without applying any limit in params - unless its asked.
7. If a query involves finding records with no associated relationship (e.g., "files without users"), use required: false in the include clause and filter where the associated model's ID is null.
8. Return valid JavaScript code for the generated Sequelize query.
9. If a query cannot be handled, return an error message in the format: "Error: real error".

- "What is the average number of files per owner?":
{
model: 'FileOwner',
function: 'findAll',
params: {
  attributes: [
    'userId',
    [Sequelize.fn('COUNT', Sequelize.col('file_id')), 'fileCount']
  ],
  include: [{
    model: 'User',
    as: 'User',  // Match the association defined in FileOwner model
    attributes: ['email', 'display_name'], // Use underscored column name
    required: true
  }],
  group: [
    'FileOwner.user_id', 
    'User.id',
    'User.email', 
    'User.display_name'  // Use underscored column name
  ],
  raw: true
}
}

or 

{
model: 'User',
function: 'findAll',
params: {
  attributes: [
    'email',
    'displayName',
    'totalFiles',
    [Sequelize.fn('AVG', Sequelize.col('total_files')), 'averageFiles']
  ],
  group: ['id', 'email', 'displayName', 'totalFiles']
}
}

- "What is the distribution of files by their last modified date?":
{
model: 'File',
function: 'findAll',
params: {
  attributes: [
    [
      Sequelize.fn('DATE', Sequelize.col('modified_time')), // Use the actual database column name
      'modifiedTime'
    ],
    [
      Sequelize.fn('COUNT', Sequelize.col('id')),
      'fileCount'
    ]
  ],
  group: [Sequelize.fn('DATE', Sequelize.col('modified_time'))] // Use consistent naming
}
}


**Examples for queries:**
- "Show all users":
{
  model: 'User',
  function: 'findAll',
  params: {}
}

- "Show files owned by john@example.com":
{
  model: 'File',
  function: 'findAll',
  params: {
    include: [{
      model: User,
      as: 'user',
      where: { email: 'john@example.com' }
    }]
  }
}

- "Show files where anyone can comment":
{
  model: 'File',
  function: 'findAll',
  params: {
    where: {
      permissions: {
        [Op.contains]: [{
          role: 'commenter',
          type: 'anyone'
        }]
      }
    }
  }
}

- "Who owns the most files?":
{
  model: 'User',
  function: 'findOne',
  params: {
    order: [['totalFiles', 'DESC']],
    limit: 1
  }
}

- "Which file was modified most recently?":
{
  model: 'File',
  function: 'findOne',
  params: {
    order: [['modifiedTime', 'DESC']],
    limit: 1
  }
}

- "What is the average number of files per owner?":
{
  model: 'User',
  function: 'findAll',
  params: {
    attributes: [
      [Sequelize.fn('AVG', Sequelize.col('totalFiles')), 'avgFiles']
    ]
  }
}

- "Which file is the largest?":
{
  model: 'File',
  function: 'findOne',
  params: {
    order: [['size', 'DESC']],
    limit: 1
  }
}

- "What is the distribution of files by their last modified date?":
{
  model: 'File',
  function: 'findAll',
  params: {
    attributes: ['modifiedTime', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
    group: ['modifiedTime']
  }
}
`;

  constructor() {
    super();
  }

  async generateQuery({ query }) {
    await this.ensureInitialized();
    try {
      const cacheKey = `${query}`;
      const cachedResult = await cacheService.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: this.systemPrompt,
          },
          {
            role: 'user',
            content: `Generate a Sequelize query function for: "${query}".`,
          },
        ],
      });

      const aiQueryConfig = this.parseAIQueryConfig(response?.choices[0]?.message?.content)
      if (!aiQueryConfig || !aiQueryConfig.model || !aiQueryConfig.function || !aiQueryConfig.params) {
        throw new Error('Query is not related to file search or permissions.');
      }

      await cacheService.set(cacheKey, aiQueryConfig);

      return aiQueryConfig;
    } catch (error) {
      throw new Error(`AI query generation failed: ${error.message}`);
    }
  }
}

module.exports = new OpenAIAnalyticsService();
