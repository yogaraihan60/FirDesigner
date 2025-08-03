# FIR Designer

A modern Electron-based application for designing Finite Impulse Response (FIR) filters from TRF (Transfer Response Function) files.

## Features

- **TRF File Support**: Import ASCII TRF files with frequency, magnitude, and phase data
- **Multiple Design Methods**: Least Squares, Window Method, and Parks-McClellan algorithms
- **Real-time Visualization**: Compare original TRF data with designed filter response
- **Export Options**: Export coefficients in multiple formats (Text, CSV, MATLAB, Python)
- **Modern UI**: Clean, responsive interface with drag-and-drop file support
- **Cross-platform**: Works on Windows, macOS, and Linux

## Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Development Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd fir-designer
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run electron:dev
```

### Building for Production

```bash
npm run electron:build
```

## Usage

### 1. Import TRF File

- Drag and drop a TRF file onto the application
- Or click "Browse Files" to select a file
- Supported format: ASCII text with frequency, magnitude, and phase columns

### 2. Configure Filter Parameters

- **Design Method**: Choose between Least Squares, Window Method, or Parks-McClellan
- **Number of Taps**: Set the filter length (power of 2 recommended)
- **Sample Rate**: Specify the sampling frequency
- **Passband Ripple**: Maximum allowed ripple in the passband (dB)
- **Stopband Attenuation**: Minimum attenuation in the stopband (dB)

### 3. Design Filter

- Click "Design Filter" to generate the FIR coefficients
- View the comparison between original TRF and designed filter response

### 4. Export Results

- Choose export format (Text, CSV, MATLAB, Python)
- Export to file or copy to clipboard
- Preview the first 10 coefficients before export

## TRF File Format

The application supports ASCII TRF files with the following format:

```
Frequency (Hz)    Magnitude (dB)    Phase (deg)
1000.0           -0.5              0.0
2000.0           -1.2              5.2
3000.0           -2.1              -3.1
...
```

### Requirements

- **Frequency**: Must be in Hz, positive values
- **Magnitude**: Must be in dB, typically between -200 and 200
- **Phase**: Must be in degrees, typically between -180 and 180
- **Headers**: Optional but supported
- **Separators**: Whitespace, tabs, or commas

## Project Structure

```
fir-designer/
├── electron/                 # Electron main process
│   ├── main.js              # Main process entry point
│   ├── preload.js           # Preload script for security
│   ├── fileManager.js       # TRF file handling
│   └── firProcessor.js      # DSP operations
├── src/                     # Vue application
│   ├── components/          # Vue components
│   │   ├── FileImporter.vue # File import UI
│   │   ├── FilterDesign.vue # Filter configuration
│   │   ├── Visualization.vue # Response visualization
│   │   └── ExportPanel.vue  # Export functionality
│   ├── stores/              # State management
│   │   └── filterStore.js   # Pinia store
│   ├── utils/               # Utilities
│   │   ├── eventHub.js      # Event management
│   │   └── trfParser.js     # TRF file parser
│   ├── App.vue              # Main application component
│   └── main.js              # Vue entry point
├── package.json             # Dependencies and scripts
├── vite.config.js           # Vite configuration
└── README.md               # This file
```

## Development

### Available Scripts

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run electron:dev` - Start Electron in development mode
- `npm run electron:build` - Build Electron application
- `npm run test` - Run tests

### Architecture

- **Frontend**: Vue 3 with Composition API and Pinia for state management
- **Backend**: Electron main process with Node.js
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: CSS with modern design system

### Key Components

1. **TRF Parser**: Robust parsing of ASCII TRF files with header detection
2. **FIR Processor**: DSP algorithms for filter design and analysis
3. **File Manager**: Secure file system operations with validation
4. **Event Hub**: Centralized event management across components
5. **State Store**: Reactive state management with Pinia

## Error Handling

The application includes comprehensive error handling:

- **File Validation**: Checks file size, format, and data integrity
- **Data Validation**: Validates frequency ranges and numeric values
- **Process Isolation**: Secure communication between main and renderer processes
- **User Feedback**: Clear error messages and status indicators

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
- Check the documentation
- Search existing issues
- Create a new issue with detailed information

## Roadmap

- [ ] Real-time frequency response plotting
- [ ] Advanced filter design algorithms
- [ ] Batch processing of multiple files
- [ ] Filter performance analysis
- [ ] Integration with external DSP libraries 