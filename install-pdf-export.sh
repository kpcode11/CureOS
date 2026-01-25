#!/bin/bash
# PDF Export Feature - Installation Script
# Usage: bash install-pdf-export.sh

echo "🚀 CureOS PDF Export Feature - Installation Script"
echo "=================================================="
echo ""

# Step 1: Check Node.js
echo "✓ Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi
echo "✅ Node.js found: $(node -v)"
echo ""

# Step 2: Check npm
echo "✓ Checking npm installation..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm first."
    exit 1
fi
echo "✅ npm found: $(npm -v)"
echo ""

# Step 3: Install jsPDF
echo "✓ Installing jsPDF and jsPDF-AutoTable..."
npm install jspdf jspdf-autotable
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo "✅ Dependencies installed successfully"
echo ""

# Step 4: Verify files exist
echo "✓ Verifying PDF export files..."
files=(
    "src/lib/pdf-generator.ts"
    "src/app/api/doctor/patients/[id]/export-pdf/route.ts"
    "src/components/doctor/patient-detail.tsx"
)

all_exist=true
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file - NOT FOUND"
        all_exist=false
    fi
done

if [ "$all_exist" = false ]; then
    echo ""
    echo "❌ Some required files are missing!"
    echo "Please ensure all files were created correctly."
    exit 1
fi
echo ""

# Step 5: Summary
echo "=================================================="
echo "✅ Installation Complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Restart your development server:"
echo "   npm run dev"
echo ""
echo "2. Open your browser and navigate to:"
echo "   http://localhost:3000"
echo ""
echo "3. Log in as a Doctor and navigate to Patients"
echo ""
echo "4. Click on a patient to view details"
echo ""
echo "5. Look for the 'Export PDF' button in the top-right corner"
echo ""
echo "Documentation:"
echo "- Quick Reference: docs/PDF_EXPORT_QUICK_REFERENCE.md"
echo "- Setup Guide: docs/guides/11-pdf-export-setup.md"
echo "- Implementation: docs/PDF_EXPORT_IMPLEMENTATION.md"
echo "- Architecture: docs/PDF_EXPORT_ARCHITECTURE.md"
echo ""
echo "Happy exporting! 📥"
