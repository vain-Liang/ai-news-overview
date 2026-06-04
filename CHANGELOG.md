## 0.1.1 (2026-05-22)

### BREAKING CHANGE

- Semantic search is re-enabled. However, due to issues with the current OpenAI API-based embedding model provider in Chroma calls, it remains unstable.
- JWT authentication has been deprecated, authentication now uses Cookie authentication only.
- this commit may be unstable
- database, code, and directory structure have been modified.

### Feat

- Initially implement news fetching
- add the news feature initially, not test
- jwt user authentication api and frontend initial single auth test page

### Refactor

- refactor news workflow and i18n
- refactor news fetching and summary
- refactor!: user authentication refactor completely
