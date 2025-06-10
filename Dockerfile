FROM nvidia/cuda:12.2.0-devel-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN sed -i 's|http://archive.ubuntu.com/ubuntu/|https://mirrors.cloud.tencent.com/ubuntu/|g' /etc/apt/sources.list && \
    sed -i 's|http://security.ubuntu.com/ubuntu|https://mirrors.cloud.tencent.com/ubuntu|g' /etc/apt/sources.list

# 安装依赖库
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    curl \
    wget \
    yasm \
    pkg-config \
    libtool \
    libx264-dev \
    libfdk-aac-dev \
    libmp3lame-dev \
    libopus-dev \
    libass-dev \
    libssl-dev \
    python3 \
    python3-pip \
    cmake \
    && ln -sf /usr/bin/python3 /usr/bin/python \
    && ln -sf /usr/bin/pip3 /usr/bin/pip \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://code-server.dev/install.sh | sh \
    && code-server --install-extension cnbcool.cnb-welcome \
    && code-server --install-extension redhat.vscode-yaml \
    && code-server --install-extension dbaeumer.vscode-eslint \
    && code-server --install-extension waderyan.gitblame \
    && code-server --install-extension mhutchie.git-graph \
    && code-server --install-extension donjayamanne.githistory \
    && code-server --install-extension tencent-cloud.coding-copilot \
    && echo done

# 编译 x265（静态安装到 /usr/local）
WORKDIR /opt
RUN git clone https://github.com/videolan/x265.git && \
    cd x265/build/linux && \
    cmake -G "Unix Makefiles" -DCMAKE_INSTALL_PREFIX="/usr/local" -DENABLE_SHARED=off ../../source && \
    make -j$(nproc) && \
    make install && \
    cd /opt && rm -rf x265

# 安装 NVIDIA 编码器头文件（nv-codec-headers）
RUN git clone https://github.com/FFmpeg/nv-codec-headers.git && \
    cd nv-codec-headers && \
    make && \
    make install && \
    cd .. && rm -rf nv-codec-headers

# 编译安装 FFmpeg
ENV PKG_CONFIG_PATH="/usr/local/lib/pkgconfig"
ENV LD_LIBRARY_PATH="/usr/local/cuda/lib64:${LD_LIBRARY_PATH}"

WORKDIR /opt
RUN git clone --depth=1 https://github.com/FFmpeg/FFmpeg.git ffmpeg && \
    cd ffmpeg && \
    ./configure \
      --prefix=/usr/local \
      --pkg-config-flags="--static" \
      --extra-cflags="-I/usr/local/include -I/usr/local/cuda/include" \
      --extra-ldflags="-L/usr/local/lib -L/usr/local/cuda/lib64" \
      --enable-shared \
      --disable-static \
      --disable-asm \
      --enable-gpl \
      --enable-nonfree \
      --enable-libx264 \
      --enable-libx265 \
      --enable-libfdk-aac \
      --enable-nvenc \
      --enable-cuvid \
      --enable-cuda \
      --enable-cuda-nvcc \
      --enable-libnpp \
      --enable-openssl && \
    make -j$(nproc) && \
    make install && \
    make distclean && \
    hash -r

ENV PATH="/usr/local/bin:$PATH"
WORKDIR /workspace
