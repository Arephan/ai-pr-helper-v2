# 📦 Publishing ReviewPal to GitHub Marketplace

## Prerequisites Checklist

- [x] LICENSE file (MIT)
- [x] README.md with clear instructions
- [x] action.yml in root directory
- [ ] Repository renamed to `reviewpal` on GitHub
- [ ] Repository is public
- [ ] Code pushed to GitHub
- [ ] First release created

## Step-by-Step Publishing Guide

### 1. Rename Repository on GitHub (if not done yet)

1. Go to https://github.com/Arephan/reviewpuck/settings
2. Scroll to "Repository name"
3. Change from `reviewpuck` to `reviewpal`
4. Click "Rename"

### 2. Make Sure Repository is Public

1. Go to Settings → Danger Zone
2. If repo is private, click "Change visibility" → "Make public"

### 3. Push Your Changes

```bash
cd /Users/hankim/clawd/ai-review-helper
git add LICENSE action.yml
git commit -m "Add LICENSE and move action.yml to root for Marketplace"
git push -u origin main
```

### 4. Create Your First Release

**Option A: Via GitHub Web UI (Recommended)**

1. Go to https://github.com/Arephan/reviewpal/releases/new
2. Fill in:
   - **Tag**: `v1.0.0` (create new tag on publish)
   - **Release title**: `v1.0.0 - Initial Release`
   - **Description**:
     ```markdown
     # 🎉 ReviewPal v1.0.0
     
     First public release! Help humans review AI-generated code faster.
     
     ## Features
     - ✅ Static analysis (no API key required)
     - ✅ React pattern detection
     - ✅ Complexity scoring
     - ✅ AI-isms detection
     - ✅ Optional Claude-powered summaries
     
     ## Quick Start
     
     Add to `.github/workflows/reviewpal.yml`:
     
     ```yaml
     name: ReviewPal
     on: pull_request
     
     jobs:
       review:
         runs-on: ubuntu-latest
         permissions:
           contents: read
           pull-requests: write
         steps:
           - uses: actions/checkout@v4
             with:
               fetch-depth: 0
           - uses: Arephan/reviewpal@v1
             with:
               anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}  # optional
     ```
     
     See [README](https://github.com/Arephan/reviewpal#readme) for full docs.
     ```
3. Click **"Publish release"**

**Option B: Via Command Line**

```bash
cd /Users/hankim/clawd/ai-review-helper

# Create and push tag
git tag -a v1.0.0 -m "Initial release"
git push origin v1.0.0

# Then create release via GitHub UI or gh CLI:
gh release create v1.0.0 \
  --title "v1.0.0 - Initial Release" \
  --notes "First public release of ReviewPal"
```

### 5. Publish to GitHub Marketplace

1. **Go to releases page**: https://github.com/Arephan/reviewpal/releases
2. **Click on your v1.0.0 release**
3. **Look for "Publish this Action to GitHub Marketplace" checkbox** (appears when repo has action.yml)
4. **Check the box** to publish
5. **Choose primary category**: "Code Quality" or "Continuous Integration"
6. **Choose icon and color** (already set in action.yml: eye + purple)
7. **Click "Publish release"**

### 6. Verify It Works

Test that others can use your action:

```yaml
# In another repo, test this workflow:
name: Test ReviewPal
on: pull_request

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: Arephan/reviewpal@v1
```

## Post-Publication

### Update Major Version Tag (v1)

GitHub Actions convention is to maintain a major version tag:

```bash
cd /Users/hankim/clawd/ai-review-helper

# Create/move v1 tag to latest v1.x.x release
git tag -fa v1 -m "Update v1 to v1.0.0"
git push origin v1 --force
```

This allows users to use `@v1` and automatically get v1.x.x updates.

### Future Releases

When you make updates:

1. **Patch release** (bug fix): `v1.0.1`, `v1.0.2`
2. **Minor release** (new feature): `v1.1.0`, `v1.2.0`
3. **Major release** (breaking change): `v2.0.0`

Always update the `v1` tag after patch/minor releases:
```bash
git tag -fa v1 -m "Update v1 to v1.x.x"
git push origin v1 --force
```

## Marketing Your Action

### Add Marketplace Badge to README

```markdown
[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-ReviewPal-blue.svg?colorA=24292e&colorB=0366d6&style=flat&longCache=true&logo=github)](https://github.com/marketplace/actions/reviewpal)
```

### Share It

- Tweet about it with #GitHubActions
- Post on Reddit: r/github, r/programming
- Share in Discord communities
- Add to awesome-actions lists

## Troubleshooting

### "action.yml not found"
- Make sure `action.yml` is in the root of your repo
- Check it's pushed to GitHub

### "Publish to Marketplace" checkbox not showing
- Ensure repo is public
- Ensure `action.yml` exists in root
- Try refreshing the releases page

### Action fails when others use it
- Test locally first: `act pull_request` (using nektos/act)
- Check all paths are relative to `${{ github.action_path }}`
- Ensure dependencies are installed in workflow

## Resources

- [GitHub Marketplace Docs](https://docs.github.com/en/actions/creating-actions/publishing-actions-in-github-marketplace)
- [Action Metadata Syntax](https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions)
- [Releasing Actions](https://docs.github.com/en/actions/creating-actions/releasing-and-maintaining-actions)
