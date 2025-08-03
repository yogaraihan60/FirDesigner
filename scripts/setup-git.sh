#!/bin/bash

echo "🚀 FIR Designer Git Setup Script"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the FIR Designer project root"
    exit 1
fi

echo "✅ Project structure verified"
echo ""

# Check Git status
if [ -d ".git" ]; then
    echo "✅ Git repository already initialized"
    echo "📊 Current status:"
    git status --porcelain
    echo ""
else
    echo "❌ Git repository not found. Please run 'git init' first"
    exit 1
fi

echo "📋 Next Steps:"
echo "=============="
echo ""
echo "1. Create a new repository on GitHub:"
echo "   - Go to https://github.com/new"
echo "   - Repository name: firfilter"
echo "   - Description: FIR Designer - Professional FIR filter design tool with Electron + Vue"
echo "   - Make it Public or Private (your choice)"
echo "   - DO NOT initialize with README, .gitignore, or license (we already have these)"
echo ""
echo "2. After creating the repository, run these commands:"
echo ""
echo "   git remote add origin https://github.com/yogaraihan60/firfilter.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Or if you prefer SSH:"
echo ""
echo "   git remote add origin git@github.com:yogaraihan60/firfilter.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "🎉 Your FIR Designer project will then be available at:"
echo "   https://github.com/yogaraihan60/firfilter"
echo ""
echo "📚 Repository includes:"
echo "   - Complete Electron + Vue + Vite application"
echo "   - TRF file parsing and paste functionality"
echo "   - Professional visualization with Bode plots"
echo "   - FIR filter design algorithms"
echo "   - Export capabilities in multiple formats"
echo "   - Comprehensive documentation and TODO tracking"
echo "" 