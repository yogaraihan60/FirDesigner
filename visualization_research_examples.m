%% FIR Designer Visualization Research Examples
% This script demonstrates the visualization logic used in the FIR Designer application
% Based on the EnhancedVisualization.vue component logic

clear all; close all; clc;

%% 1. Data Structure and 22kHz Cutoff Logic
fprintf('=== 1. Data Structure and 22kHz Cutoff Logic ===\n');

% Simulate TRF data with frequencies up to 50kHz (will be cut at 22kHz)
freq_original = [100, 200, 500, 1000, 2000, 5000, 10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000];
mag_original = [-0.1, -0.2, -0.5, -1.0, -2.1, -3.2, -4.5, -6.1, -8.2, -10.8, -14.2, -18.5, -23.1, -28.7, -35.2];
phase_original = [0.0, 0.5, 1.2, 2.1, 4.3, 6.8, 9.2, 12.5, 16.3, 21.4, 28.7, 37.2, 45.8, 54.3, 62.1];

% Apply 22kHz cutoff (equivalent to apply22kHzCutoff function)
cutoff_mask = freq_original <= 22000;
freq_filtered = freq_original(cutoff_mask);
mag_filtered = mag_original(cutoff_mask);
phase_filtered = phase_original(cutoff_mask);

fprintf('Original data points: %d\n', length(freq_original));
fprintf('After 22kHz cutoff: %d\n', length(freq_filtered));
fprintf('Max frequency before: %.0f Hz\n', max(freq_original));
fprintf('Max frequency after: %.0f Hz\n', max(freq_filtered));

%% 2. Logarithmic Frequency Scaling Logic
fprintf('\n=== 2. Logarithmic Frequency Scaling Logic ===\n');

% Define frequency range (20Hz to 20kHz)
freq_min = 20;
freq_max = 20000;

% Grid frequencies for logarithmic scale
grid_freqs = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];

% Calculate logarithmic positions (equivalent to drawGrid function)
log_freq_min = log10(freq_min);
log_freq_max = log10(freq_max);
log_grid_positions = (log10(grid_freqs) - log_freq_min) / (log_freq_max - log_freq_min);

fprintf('Grid frequencies: ');
fprintf('%.0f ', grid_freqs);
fprintf('\n');
fprintf('Logarithmic positions: ');
fprintf('%.3f ', log_grid_positions);
fprintf('\n');

%% 3. Coordinate Transformation Logic
fprintf('\n=== 3. Coordinate Transformation Logic ===\n');

% Canvas dimensions (equivalent to width and height)
canvas_width = 800;
canvas_height = 400;
margin_left = 40;
margin_right = 40;
margin_top = 20;
margin_bottom = 40;

% Plot area dimensions
plot_width = canvas_width - margin_left - margin_right;
plot_height = canvas_height - margin_top - margin_bottom;

% Magnitude range
mag_min = -30;
mag_max = 10;

% Phase range
phase_min = -180;
phase_max = 180;

% Transform frequency to x-coordinate (logarithmic)
x_coords = (log10(freq_filtered) - log_freq_min) / (log_freq_max - log_freq_min) * plot_width + margin_left;

% Transform magnitude to y-coordinate (linear, inverted)
y_mag_coords = ((mag_max - mag_filtered) / (mag_max - mag_min)) * plot_height + margin_top;

% Transform phase to y-coordinate (linear, inverted)
y_phase_coords = ((phase_max - phase_filtered) / (phase_max - phase_min)) * plot_height + margin_top;

fprintf('Frequency transformation example:\n');
for i = 1:min(5, length(freq_filtered))
    fprintf('  %.0f Hz -> x=%.1f\n', freq_filtered(i), x_coords(i));
end

fprintf('Magnitude transformation example:\n');
for i = 1:min(5, length(mag_filtered))
    fprintf('  %.1f dB -> y=%.1f\n', mag_filtered(i), y_mag_coords(i));
end

%% 4. Complete Visualization Example
fprintf('\n=== 4. Complete Visualization Example ===\n');

% Create figure with similar styling to the web app
figure('Position', [100, 100, 900, 500], 'Color', 'black');

% Create axes with black background
ax = axes('Color', 'black', 'XColor', 'white', 'YColor', 'white', ...
          'GridColor', [0.2, 0.2, 0.2], 'GridAlpha', 0.3);

% Set logarithmic x-axis
set(ax, 'XScale', 'log');
xlim([freq_min, freq_max]);
ylim([mag_min, mag_max]);

% Add grid
grid on;
set(ax, 'GridColor', [0.2, 0.2, 0.2], 'GridAlpha', 0.3);

% Plot magnitude response
plot(freq_filtered, mag_filtered, 'Color', '#ff6b6b', 'LineWidth', 2, 'DisplayName', 'Magnitude (dB)');

% Add labels
xlabel('Frequency (Hz)', 'Color', 'white', 'FontSize', 12);
ylabel('Magnitude (dB)', 'Color', '#ff6b6b', 'FontSize', 12);
title('FIR Designer Visualization - Magnitude Response', 'Color', 'white', 'FontSize', 14);

% Add legend
legend('Location', 'best', 'TextColor', 'white', 'Color', 'black');

% Set grid lines at specific frequencies
set(ax, 'XTick', grid_freqs);
set(ax, 'XTickLabel', arrayfun(@(x) sprintf('%.0f', x), grid_freqs, 'UniformOutput', false));

fprintf('Visualization created successfully!\n');

%% 5. Interactive Point Selection Logic
fprintf('\n=== 5. Interactive Point Selection Logic ===\n');

% Simulate mouse click at a specific position
mouse_x = 400; % pixels
mouse_y = 200; % pixels

% Convert mouse position back to frequency and magnitude
freq_click = 10^((mouse_x - margin_left) / plot_width * (log_freq_max - log_freq_min) + log_freq_min);
mag_click = mag_max - (mouse_y - margin_top) / plot_height * (mag_max - mag_min);

fprintf('Mouse click at (%.0f, %.0f) pixels\n', mouse_x, mouse_y);
fprintf('Corresponds to: %.1f Hz, %.1f dB\n', freq_click, mag_click);

% Find closest data point
distances = sqrt((x_coords - mouse_x).^2 + (y_mag_coords - mouse_y).^2);
[~, closest_idx] = min(distances);

fprintf('Closest data point: %.1f Hz, %.1f dB (index %d)\n', ...
        freq_filtered(closest_idx), mag_filtered(closest_idx), closest_idx);

%% 6. Sample Rate Detection Logic
fprintf('\n=== 6. Sample Rate Detection Logic ===\n');

% Equivalent to detectOptimalSampleRate function
max_freq = max(freq_filtered);
if max_freq <= 22000
    sample_rate = 48000;
else
    sample_rate = ceil(max_freq * 2 * 1.1); % Nyquist * safety margin
end

fprintf('Maximum frequency: %.0f Hz\n', max_freq);
fprintf('Optimal sample rate: %.0f Hz\n', sample_rate);

%% 7. Data Quality Assessment Logic
fprintf('\n=== 7. Data Quality Assessment Logic ===\n');

% Frequency band analysis
low_freq_count = sum(freq_filtered >= 20 & freq_filtered < 200);
mid_freq_count = sum(freq_filtered >= 200 & freq_filtered < 2000);
high_freq_count = sum(freq_filtered >= 2000 & freq_filtered < 20000);
very_high_freq_count = sum(freq_filtered >= 20000 & freq_filtered <= 22000);

total_points = length(freq_filtered);
low_freq_ratio = low_freq_count / total_points;
high_freq_ratio = high_freq_count / total_points;

fprintf('Frequency distribution:\n');
fprintf('  Low (20-200 Hz): %d points (%.1f%%)\n', low_freq_count, low_freq_ratio * 100);
fprintf('  Mid (200-2k Hz): %d points (%.1f%%)\n', mid_freq_count, mid_freq_count/total_points * 100);
fprintf('  High (2k-20k Hz): %d points (%.1f%%)\n', high_freq_count, high_freq_ratio * 100);
fprintf('  Very High (20k-22k Hz): %d points (%.1f%%)\n', very_high_freq_count, very_high_freq_count/total_points * 100);

% Quality warnings
warnings = {};
if low_freq_ratio < 0.1
    warnings{end+1} = 'Limited low frequency data (< 200 Hz)';
end
if high_freq_ratio < 0.1
    warnings{end+1} = 'Limited high frequency data (2k-20k Hz)';
end
if max_freq == 22000
    warnings{end+1} = 'Data automatically cut at 22kHz (human hearing limit)';
end

if isempty(warnings)
    fprintf('Data quality: Good\n');
else
    fprintf('Data quality warnings:\n');
    for i = 1:length(warnings)
        fprintf('  - %s\n', warnings{i});
    end
end

%% 8. Phase Response Visualization
fprintf('\n=== 8. Phase Response Visualization ===\n');

% Create second figure for phase response
figure('Position', [200, 200, 900, 500], 'Color', 'black');

ax2 = axes('Color', 'black', 'XColor', 'white', 'YColor', 'white', ...
           'GridColor', [0.2, 0.2, 0.2], 'GridAlpha', 0.3);

set(ax2, 'XScale', 'log');
xlim([freq_min, freq_max]);
ylim([phase_min, phase_max]);

grid on;
set(ax2, 'GridColor', [0.2, 0.2, 0.2], 'GridAlpha', 0.3);

% Plot phase response
plot(freq_filtered, phase_filtered, 'Color', '#4ecdc4', 'LineWidth', 2, 'DisplayName', 'Phase (deg)');

xlabel('Frequency (Hz)', 'Color', 'white', 'FontSize', 12);
ylabel('Phase (deg)', 'Color', '#4ecdc4', 'FontSize', 12);
title('FIR Designer Visualization - Phase Response', 'Color', 'white', 'FontSize', 14);

legend('Location', 'best', 'TextColor', 'white', 'Color', 'black');
set(ax2, 'XTick', grid_freqs);

%% 9. Combined Magnitude and Phase Plot
fprintf('\n=== 9. Combined Magnitude and Phase Plot ===\n');

% Create combined plot (similar to the web app)
figure('Position', [300, 300, 900, 500], 'Color', 'black');

% Create subplot for magnitude
subplot(2, 1, 1);
ax_mag = gca;
set(ax_mag, 'Color', 'black', 'XColor', 'white', 'YColor', '#ff6b6b', ...
            'GridColor', [0.2, 0.2, 0.2], 'GridAlpha', 0.3);
set(ax_mag, 'XScale', 'log');
xlim([freq_min, freq_max]);
ylim([mag_min, mag_max]);
grid on;

plot(freq_filtered, mag_filtered, 'Color', '#ff6b6b', 'LineWidth', 2);
ylabel('Magnitude (dB)', 'Color', '#ff6b6b', 'FontSize', 12);
title('Combined Response', 'Color', 'white', 'FontSize', 14);

% Create subplot for phase
subplot(2, 1, 2);
ax_phase = gca;
set(ax_phase, 'Color', 'black', 'XColor', 'white', 'YColor', '#4ecdc4', ...
              'GridColor', [0.2, 0.2, 0.2], 'GridAlpha', 0.3);
set(ax_phase, 'XScale', 'log');
xlim([freq_min, freq_max]);
ylim([phase_min, phase_max]);
grid on;

plot(freq_filtered, phase_filtered, 'Color', '#4ecdc4', 'LineWidth', 2);
xlabel('Frequency (Hz)', 'Color', 'white', 'FontSize', 12);
ylabel('Phase (deg)', 'Color', '#4ecdc4', 'FontSize', 12);

fprintf('All visualizations completed successfully!\n');
fprintf('\n=== Summary ===\n');
fprintf('This MATLAB script demonstrates the core visualization logic from the FIR Designer application:\n');
fprintf('1. 22kHz automatic cutoff for human hearing range\n');
fprintf('2. Logarithmic frequency scaling (20Hz - 20kHz)\n');
fprintf('3. Coordinate transformation for canvas rendering\n');
fprintf('4. Interactive point selection and editing\n');
fprintf('5. Sample rate optimization (48kHz for 22kHz content)\n');
fprintf('6. Data quality assessment and warnings\n');
fprintf('7. Magnitude and phase response visualization\n'); 