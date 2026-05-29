function img_rgb = cymatics_pattern(frequencies, magnitudes, resolution)
    
    if nargin < 3, resolution = 512; end

    % force both to column vectors regardless of how they come in
    frequencies = frequencies(:);
    magnitudes  = magnitudes(:);

    % check we have enough data
    if numel(magnitudes) < 8
        img_rgb = zeros(resolution, resolution, 3);
        return
    end

    % load chakra colour map
    persistent chakraData
    if isempty(chakraData)
        chakraData = readtable('frequency_colours.csv');
    end

    % pick top frequencies
    numFreqs = 8;
    [sortedMag, idx] = sort(magnitudes, 'descend');
    topFreqs = frequencies(idx(1:numFreqs));
    topMags  = sortedMag(1:numFreqs);

    if sum(topMags) > 0
        topMags = topMags / sum(topMags);
    end

    % build 2D grid
    x = linspace(-1, 1, resolution);
    y = linspace(-1, 1, resolution);
    [X, Y] = meshgrid(x, y);

    % generate pattern intensity (grayscale still)
    pattern = zeros(resolution);
    for i = 1:numFreqs
        k = topFreqs(i) / 80;
        pattern = pattern + topMags(i) .* sin(k .* X) .* sin(k .* Y);
    end
    pattern = abs(pattern);
    pattern = mat2gray(pattern);  % 0-1 grayscale

    % find dominant frequency and get its chakra colour
    dominantFreq = topFreqs(1);  % loudest frequency this frame

    % find closest chakra frequency in the CSV
    [~, chakraIdx] = min(abs(chakraData.freq_hz - dominantFreq));
    r = chakraData.r(chakraIdx) / 255;
    g = chakraData.g(chakraIdx) / 255;
    b = chakraData.b(chakraIdx) / 255;

    % apply colour to pattern as RGB image
    img_rgb = zeros(resolution, resolution, 3);
    img_rgb(:,:,1) = pattern * r;
    img_rgb(:,:,2) = pattern * g;
    img_rgb(:,:,3) = pattern * b;

end