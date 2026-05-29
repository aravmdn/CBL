function frame = camera_input(cam)
% CAMERA_INPUT Captures one frame from a live webcam
%
% Input:
%   cam - webcam object (created once in main.m and passed in)
%
% Output:
%   frame - RGB image (H x W x 3 uint8)

    frame = snapshot(cam);

end