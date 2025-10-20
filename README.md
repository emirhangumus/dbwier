# DBwier - Database Schema Visualizer 🗄️

A modern, interactive PostgreSQL schema visualizer built with React, ReactFlow, and Bun.

![DBwier Screenshot](https://img.shields.io/badge/status-active-success.svg)
![Bun](https://img.shields.io/badge/bun-1.0-blue.svg)
![React](https://img.shields.io/badge/react-19-blue.svg)

## ✨ Features

### 🎨 Visual Enhancements
- **Color-Coded Data Types**: Different colors for integers, text, dates, JSON, UUIDs, etc.
- **Smart Icons**: 
  - 🔑 Yellow key for Primary Keys
  - 🛡️ Cyan shield for Unique constraints
  - ⭐ Red asterisk for NOT NULL constraints
- **Connection Points**: Handles only appear on columns with actual foreign key relationships
- **Dynamic Node Sizing**: Nodes expand to show all columns without scrolling

### 🔍 Search & Filter
- **Real-time Search**: Find tables and columns instantly
- **Smart Filtering**: Search by table name, column name, or data type
- **Auto-hide**: Non-matching tables are hidden from view

### 📐 Layout Options
- **4 Layout Directions**: Left-to-Right, Top-to-Bottom, Right-to-Left, Bottom-to-Top
- **Auto-alignment**: Intelligent spacing prevents node overlap
- **Drag & Drop**: Freely position nodes after auto-layout
- **Dynamic Spacing**: Calculates proper spacing based on node heights

### 💾 Import/Export
- **SQL Import/Export**: Load and save `.sql` files
- **PNG Export**: Export diagram as image (requires `html-to-image`)
- **SVG Export**: Export as scalable vector graphics
- **Share via URL**: Encode schema in URL for easy sharing

### 📊 Schema Intelligence
- **Foreign Key Details**: Shows ON DELETE/UPDATE rules
- **Constraint Detection**: UNIQUE, NOT NULL, DEFAULT values
- **Column Count Badge**: Quick overview of table size
- **Stats Panel**: Real-time counts of tables, columns, and foreign keys

### 🎯 Interactive Features
- **Zoom & Pan**: Smooth navigation with mouse/trackpad
- **Mini-map**: Overview of entire schema
- **Node Selection**: Click to select tables
- **Hover Effects**: Visual feedback on interaction
- **Precise Connections**: Edges connect to exact column rows

### 🌐 Collaboration
- **URL Sharing**: Share schemas via encoded URLs
- **LocalStorage**: Auto-saves your work
- **Load from URL**: Support schema parameter in URL

## 🚀 Getting Started

### Prerequisites
- [Bun](https://bun.sh) >= 1.0

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd dbwier

# Install dependencies
bun install

# Optional: Install image export library
bun add html-to-image

# Start development server
bun run dev
```

Visit `http://localhost:5522` in your browser.

## 📖 Usage

### 1. Paste Your Schema
Click **"Edit SQL"** button and paste your PostgreSQL schema:

```sql
CREATE TABLE users (
    id bigint PRIMARY KEY,
    email text NOT NULL UNIQUE,
    name text,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    id bigint PRIMARY KEY,
    user_id bigint NOT NULL,
    title text NOT NULL,
    content text
);

ALTER TABLE posts
ADD CONSTRAINT posts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;
```

### 2. Search & Filter
Use the search box to find specific tables or columns:
- Search by table name: `users`
- Search by column: `email`
- Search by type: `bigint`

### 3. Arrange Layout
Click the layout buttons (LR, TB, RL, BT) to auto-arrange nodes in different directions.

### 4. Export & Share
- **Export SQL**: Download your schema as `.sql` file
- **Export PNG/SVG**: Save diagram as image (install `html-to-image` first)
- **Share**: Copy shareable URL to clipboard

## 🎨 Visual Legend

| Symbol | Meaning |
|--------|---------|
| 🔑 Yellow Key | Primary Key |
| 🛡️ Cyan Shield | Unique Constraint |
| ⭐ Red Asterisk | NOT NULL |
| 🔵 Blue | Numeric Types (int, bigint, serial) |
| 🟢 Green | Text Types (varchar, text, char) |
| 🟣 Purple | Boolean |
| 🟠 Orange | Date/Time |
| 🟡 Yellow | JSON |
| 🔴 Pink | UUID |

## 🛠️ Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Framework**: [React 19](https://react.dev)
- **Diagrams**: [ReactFlow](https://reactflow.dev)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **Icons**: [Lucide React](https://lucide.dev)
- **Layout**: [Dagre](https://github.com/dagrejs/dagre)

## 📝 Supported SQL Features

### ✅ Fully Supported
- CREATE TABLE with IF NOT EXISTS
- Column definitions with types
- PRIMARY KEY (inline and table-level)
- NOT NULL constraints
- UNIQUE constraints
- DEFAULT values
- ALTER TABLE ADD CONSTRAINT FOREIGN KEY
- Inline REFERENCES
- ON DELETE CASCADE/SET NULL/RESTRICT/NO ACTION
- ON UPDATE CASCADE/SET NULL/RESTRICT/NO ACTION
- Schema prefixes (e.g., `writer_schema.table_name`)

### ⚠️ Partially Supported
- CHECK constraints (parsed but not visualized)
- Indexes (detected but not shown)
- Comments (parsed but not displayed)

### ❌ Not Yet Supported
- CREATE INDEX statements
- ENUM types
- Triggers
- Views
- Functions/Procedures

## 🔮 Upcoming Features

- [ ] Multiple SQL dialect support (MySQL, SQLite, SQL Server)
- [ ] Syntax highlighting in SQL editor
- [ ] Click table for detailed info modal
- [ ] Show indexes with visual indicators
- [ ] Generate ORM models (Prisma, TypeORM)
- [ ] Schema comparison tool
- [ ] Dark/Light theme toggle
- [ ] Mermaid diagram export
- [ ] PDF documentation export

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit PRs.

## 📄 License

MIT License - feel free to use this project however you'd like!

## 🙏 Acknowledgments

Built with ❤️ using amazing open-source tools and libraries.

---

**Made with Bun and React** 🚀
