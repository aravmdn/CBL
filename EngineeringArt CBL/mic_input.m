function [frequencies, magnitudes, audioData] = mic_input(fs, frameSize)
% MIC_INPUT Captures one frame of live microphone audio and returns FFT data
%
% Inputs:
%   fs        - sample rate in Hz (default 44100)
%   frameSize - number of samples per frame (default 1024)
%
% Outputs:
%   frequencies - frequency axis in Hz (frameSize/2 x 1)
%   magnitudes  - FFT magnitude at each frequency (frameSize/2 x 1)
%   audioData   - raw audio samples (frameSize x 1)

    if nargin < 1, fs = 44100; end
    if nargin < 2, frameSize = 1024; end

    persistent reader

    % only create the reader once, reuse it across calls
    if isempty(reader)
        reader = audioDeviceReader('SampleRate', fs, ...
                                   'SamplesPerFrame', frameSize, ...
                                   'NumChannels', 1);
    end

    % grab one frame
    audioData = reader();

    % FFT
    Y = fft(audioData, frameSize);
    Y = Y(1:frameSize/2);             % keep only positive frequencies
    magnitudes = abs(Y) / frameSize;  % normalise
    frequencies = (0:frameSize/2-1) * (fs / frameSize);

end

