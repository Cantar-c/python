import subprocess


def try_encode_with_gpu(input_path, output_path):
    gpu_cmd = [
        'ffmpeg', '-hwaccel', 'cuda', '-i', input_path,
        '-vf', 'scale_npp=w=1280:h=720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2',
        '-c:v', 'h264_nvenc', '-preset', 'fast', '-rc', 'vbr', '-cq', '23',
        '-c:a', 'aac', '-b:a', '128k',
        '-y', output_path
    ]
    try:
        subprocess.run(gpu_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        return True
    except subprocess.CalledProcessError:
        return False


def encode_fallback(input_path, output_path):
    cpu_cmd = [
        'ffmpeg', '-i', input_path,
        '-vf', 'scale=w=1280:h=720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2',
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
        '-c:a', 'aac', '-b:a', '128k',
        '-y', output_path
    ]
    subprocess.run(cpu_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
