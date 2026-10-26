# Attend — GitHub Issues and Discussions setup

This folder contains ready-to-add GitHub issue forms and discussion category forms for https://github.com/prabhav-vijay/attend.

## 1. Add the files to the repository

Copy the `.github` directory from this package into the root of the Attend repository. Preserve the exact paths and filenames. The repository should contain:

```text
.github/
├── ISSUE_TEMPLATE/
│   ├── 01-bug-report.yml
│   ├── 02-feature-request.yml
│   ├── 03-data-import-export.yml
│   └── config.yml
└── DISCUSSION_TEMPLATE/
    ├── general.yml
    ├── q-a.yml
    └── ideas.yml
```

Commit the files to the repository's **default branch**. Templates in another branch won't be available to people opening new issues/discussions until merged to the default branch.

You can add them in VS Code and push as usual, or use GitHub's Add file → Create new file interface for each file.

## 2. Create labels before relying on auto-labelling

GitHub only automatically applies a template's labels if those labels already exist. In the repository, open **Issues → Labels** and create these labels (exact spelling):

- `bug` — something is broken
- `needs-triage` — needs maintainer review
- `enhancement` — feature request
- `question` — question discussion
- `idea` — idea discussion

Optional colours are up to you. Keep the names exact so the YAML templates can apply them.

## 3. Enable GitHub Discussions

1. Open https://github.com/prabhav-vijay/attend.
2. Open **Settings** (you need repository admin permission).
3. Find **Features**.
4. Enable **Discussions**.
5. Open the new **Discussions** tab and configure categories.

Recommended categories:

- **General** — general conversation and feedback; category type **Discussion**.
- **Q&A** — questions and answers; category type **Question/Answer**.
- **Ideas** — early-stage feature brainstorming; category type **Idea**.
- **Announcements** — release notes and maintainer updates; category type **Announcement**. Keep this maintainer-only if GitHub offers that setting.

The discussion form filenames must match category slugs. This package includes forms for `general`, `q-a`, and `ideas`. If a category has a different slug in your repository, rename its corresponding YAML file to match the slug. Creating these files does not itself create the categories; create categories in the Discussions settings/UI first.

## 4. Test the forms

After the files are on the default branch and Discussions is enabled:

1. Open **Issues → New issue** and confirm that Bug report, Feature request, and Data import or export problem appear.
2. Start filling out each form and check that the fields are clear. Cancel before submitting test issues publicly.
3. Open **Discussions → New discussion** and confirm that the General, Q&A, and Ideas forms are available in the matching categories.
4. If a template doesn't appear, check YAML formatting, spelling, and whether its file is on the default branch. For discussion forms, make sure the filename matches the category slug exactly.
5. Confirm that the labels listed above exist; otherwise GitHub will not automatically apply them.

## 5. Workflow guidance

- **Issues:** reproducible bugs, data import/export failures, and actionable feature requests.
- **Discussions:** usage questions, general feedback, and early-stage brainstorming.
- **Email:** private or sensitive concerns at `contact.attend.dev@gmail.com`.

Issues and discussions are public. Never ask users to attach genuine attendance exports, student identifiers, credentials, or other personal data. Use fabricated examples and redacted screenshots instead.

## Official GitHub documentation

- [Configure issue templates](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository)
- [Enable Discussions](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository)
- [Create discussion category forms](https://docs.github.com/en/discussions/managing-discussions-for-your-community/creating-discussion-category-forms)
- [Discussion form syntax](https://docs.github.com/en/discussions/managing-discussions-for-your-community/syntax-for-discussion-category-forms)
