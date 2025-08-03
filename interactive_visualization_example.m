%% Interactive Visualization Example - FIR Designer Logic
% This script demonstrates the interactive editing capabilities
% Based on the EnhancedVisualization.vue component logic

clear all; close all; clc;

%% 1. Setup Data and Visualization
fprintf('=== Interactive Visualization Example ===\n');

% Create sample TRF data
freq = [100, 200, 500, 1000, 2000, 5000, 10000, 15000, 20000];
mag = [-0.1, -0.2, -0.5, -1.0, -2.1, -3.2, -4.5, -6.1, -8.2];
phase = [0.0, 0.5, 1.2, 2.1, 4.3, 6.8, 9.2, 12.5, 16.3];

% Apply 22kHz cutoff
cutoff_mask = freq <= 22000;
freq = freq(cutoff_mask);
mag = mag(cutoff_mask);
phase = phase(cutoff_mask);

% Visualization parameters
freq_min = 20;
freq_max = 20000;
mag_min = -30;
mag_max = 10;
phase_min = -180;
phase_max = 180;

%% 2. Create Interactive Figure
fprintf('Creating interactive visualization...\n');

% Create figure with black background
fig = figure('Position', [100, 100, 1000, 600], 'Color', 'black', ...
             'Name', 'FIR Designer - Interactive Visualization', ...
             'NumberTitle', 'off');

% Create axes for magnitude
ax_mag = subplot(2, 1, 1);
set(ax_mag, 'Color', 'black', 'XColor', 'white', 'YColor', '#ff6b6b', ...
            'GridColor', [0.2, 0.2, 0.2], 'GridAlpha', 0.3);
set(ax_mag, 'XScale', 'log');
xlim([freq_min, freq_max]);
ylim([mag_min, mag_max]);
grid on;

% Plot magnitude response
mag_line = plot(freq, mag, 'Color', '#ff6b6b', 'LineWidth', 2, 'Marker', 'o', ...
                'MarkerSize', 6, 'MarkerFaceColor', '#ff6b6b');
hold on;

% Plot selected point (initially none)
selected_point = plot(NaN, NaN, 'o', 'MarkerSize', 10, 'MarkerFaceColor', 'yellow', ...
                      'MarkerEdgeColor', 'white', 'LineWidth', 2);

ylabel('Magnitude (dB)', 'Color', '#ff6b6b', 'FontSize', 12);
title('Interactive Magnitude Response (Click to select points)', 'Color', 'white', 'FontSize', 14);

% Create axes for phase
ax_phase = subplot(2, 1, 2);
set(ax_phase, 'Color', 'black', 'XColor', 'white', 'YColor', '#4ecdc4', ...
               'GridColor', [0.2, 0.2, 0.2], 'GridAlpha', 0.3);
set(ax_phase, 'XScale', 'log');
xlim([freq_min, freq_max]);
ylim([phase_min, phase_max]);
grid on;

% Plot phase response
phase_line = plot(freq, phase, 'Color', '#4ecdc4', 'LineWidth', 2, 'Marker', 'o', ...
                  'MarkerSize', 6, 'MarkerFaceColor', '#4ecdc4');

xlabel('Frequency (Hz)', 'Color', 'white', 'FontSize', 12);
ylabel('Phase (deg)', 'Color', '#4ecdc4', 'FontSize', 12);

%% 3. Interactive Point Selection Logic
fprintf('Setting up interactive point selection...\n');

% Global variables for interactive editing
selected_idx = [];
edit_mode = 'magnitude'; % 'magnitude' or 'phase'
is_dragging = false;

% Function to find closest point
function idx = findClosestPoint(click_freq, click_mag, freq_data, mag_data)
    % Convert click to data coordinates
    distances = sqrt(((freq_data - click_freq) / (max(freq_data) - min(freq_data))).^2 + ...
                     ((mag_data - click_mag) / (max(mag_data) - min(mag_data))).^2);
    [~, idx] = min(distances);
end

% Function to update visualization
function updatePlot()
    % Update magnitude plot
    set(mag_line, 'XData', freq, 'YData', mag);
    
    % Update phase plot
    set(phase_line, 'XData', freq, 'YData', phase);
    
    % Update selected point
    if ~isempty(selected_idx)
        set(selected_point, 'XData', freq(selected_idx), 'YData', mag(selected_idx));
    else
        set(selected_point, 'XData', NaN, 'YData', NaN);
    end
    
    % Update title with current selection
    if ~isempty(selected_idx)
        title_str = sprintf('Selected: %.1f Hz, %.1f dB (Click and drag to edit)', ...
                           freq(selected_idx), mag(selected_idx));
    else
        title_str = 'Interactive Magnitude Response (Click to select points)';
    end
    title(ax_mag, title_str, 'Color', 'white', 'FontSize', 14);
end

%% 4. Mouse Event Handlers
fprintf('Setting up mouse event handlers...\n');

% Mouse down event
set(fig, 'WindowButtonDownFcn', @mouseDown);

function mouseDown(src, ~)
    % Get current point
    pt = get(ax_mag, 'CurrentPoint');
    click_freq = pt(1, 1);
    click_mag = pt(1, 2);
    
    % Find closest point
    idx = findClosestPoint(click_freq, click_mag, freq, mag);
    
    % Check if click is close enough to a point
    distance = sqrt(((freq(idx) - click_freq) / (freq_max - freq_min)).^2 + ...
                    ((mag(idx) - click_mag) / (mag_max - mag_min)).^2);
    
    if distance < 0.05 % Threshold for selection
        selected_idx = idx;
        is_dragging = true;
        updatePlot();
        fprintf('Selected point %d: %.1f Hz, %.1f dB\n', idx, freq(idx), mag(idx));
    end
end

% Mouse move event
set(fig, 'WindowButtonMotionFcn', @mouseMove);

function mouseMove(src, ~)
    if is_dragging && ~isempty(selected_idx)
        % Get current point
        pt = get(ax_mag, 'CurrentPoint');
        new_mag = pt(1, 2);
        
        % Constrain to range
        new_mag = max(mag_min, min(mag_max, new_mag));
        
        % Update data
        mag(selected_idx) = new_mag;
        
        % Update plot
        updatePlot();
        
        fprintf('Updated point %d: %.1f Hz, %.1f dB\n', selected_idx, freq(selected_idx), mag(selected_idx));
    end
end

% Mouse up event
set(fig, 'WindowButtonUpFcn', @mouseUp);

function mouseUp(src, ~)
    is_dragging = false;
    fprintf('Edit completed\n');
end

%% 5. Keyboard Controls
fprintf('Setting up keyboard controls...\n');

% Keyboard event handler
set(fig, 'KeyPressFcn', @keyPress);

function keyPress(src, event)
    switch event.Key
        case 'm'
            edit_mode = 'magnitude';
            fprintf('Edit mode: Magnitude\n');
        case 'p'
            edit_mode = 'phase';
            fprintf('Edit mode: Phase\n');
        case 'escape'
            selected_idx = [];
            is_dragging = false;
            updatePlot();
            fprintf('Selection cleared\n');
        case 'r'
            % Reset to original data
            mag = [-0.1, -0.2, -0.5, -1.0, -2.1, -3.2, -4.5, -6.1, -8.2];
            phase = [0.0, 0.5, 1.2, 2.1, 4.3, 6.8, 9.2, 12.5, 16.3];
            updatePlot();
            fprintf('Data reset to original values\n');
    end
end

%% 6. Data Quality Assessment
fprintf('Performing data quality assessment...\n');

% Frequency band analysis
low_freq_count = sum(freq >= 20 & freq < 200);
mid_freq_count = sum(freq >= 200 & freq < 2000);
high_freq_count = sum(freq >= 2000 & freq < 20000);

total_points = length(freq);
low_freq_ratio = low_freq_count / total_points;
high_freq_ratio = high_freq_count / total_points;

fprintf('Data quality assessment:\n');
fprintf('  Total points: %d\n', total_points);
fprintf('  Low frequency (20-200 Hz): %d points (%.1f%%)\n', low_freq_count, low_freq_ratio * 100);
fprintf('  Mid frequency (200-2k Hz): %d points (%.1f%%)\n', mid_freq_count, mid_freq_count/total_points * 100);
fprintf('  High frequency (2k-20k Hz): %d points (%.1f%%)\n', high_freq_count, high_freq_ratio * 100);

% Quality warnings
warnings = {};
if low_freq_ratio < 0.1
    warnings{end+1} = 'Limited low frequency data (< 200 Hz)';
end
if high_freq_ratio < 0.1
    warnings{end+1} = 'Limited high frequency data (2k-20k Hz)';
end
if max(freq) == 22000
    warnings{end+1} = 'Data automatically cut at 22kHz (human hearing limit)';
end

if isempty(warnings)
    fprintf('  Quality: Good\n');
else
    fprintf('  Quality warnings:\n');
    for i = 1:length(warnings)
        fprintf('    - %s\n', warnings{i});
    end
end

%% 7. Sample Rate Optimization
fprintf('Sample rate optimization:\n');
max_freq = max(freq);
if max_freq <= 22000
    sample_rate = 48000;
else
    sample_rate = ceil(max_freq * 2 * 1.1);
end
fprintf('  Maximum frequency: %.0f Hz\n', max_freq);
fprintf('  Optimal sample rate: %.0f Hz\n', sample_rate);

%% 8. Instructions Display
fprintf('\n=== Interactive Controls ===\n');
fprintf('Mouse:\n');
fprintf('  - Click on points to select them\n');
fprintf('  - Click and drag to edit magnitude values\n');
fprintf('  - Points are highlighted in yellow when selected\n');
fprintf('\nKeyboard:\n');
fprintf('  - M: Switch to magnitude edit mode\n');
fprintf('  - P: Switch to phase edit mode\n');
fprintf('  - ESC: Clear selection\n');
fprintf('  - R: Reset data to original values\n');
fprintf('\nVisualization Features:\n');
fprintf('  - Logarithmic frequency scale (20Hz - 20kHz)\n');
fprintf('  - Automatic 22kHz cutoff for human hearing range\n');
fprintf('  - Real-time data quality assessment\n');
fprintf('  - Interactive point selection and editing\n');
fprintf('  - Sample rate optimization (48kHz for 22kHz content)\n');

%% 9. Real-time Statistics Display
% Create text box for statistics
annotation('textbox', [0.02, 0.02, 0.3, 0.15], ...
           'String', {'Statistics:', ...
                      sprintf('Points: %d', length(freq)), ...
                      sprintf('Max Freq: %.0f Hz', max(freq)), ...
                      sprintf('Sample Rate: %.0f Hz', sample_rate)}, ...
           'Color', 'white', 'BackgroundColor', 'black', ...
           'EdgeColor', 'white', 'FontSize', 10);

fprintf('\nInteractive visualization ready!\n');
fprintf('Try clicking on points and dragging to edit values.\n'); 