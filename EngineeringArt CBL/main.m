% main.m - test: shows live cymatics pattern driven by mic input
% no camera overlay yet

fs         = 44100;
frameSize  = 2048;
resolution = 512;

fig = figure('Name', 'Cymatics Pattern', 'Color', 'black', ...
             'Position', [100, 100, 800, 800]);
ax  = axes('Parent', fig, 'Position', [0, 0, 1, 1]);
h   = image(zeros(resolution, resolution, 3), 'Parent', ax);
axis(ax, 'off');
disp('Running... close figure to stop');

while ishandle(fig)

    [frequencies, magnitudes, ~] = mic_input(fs, frameSize);
    pattern = cymatics_pattern(frequencies, magnitudes, resolution);

    set(h, 'CData', pattern);
    drawnow;

end