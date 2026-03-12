FROM node:20

# Install Java + tools
RUN apt-get update && \
    apt-get install -y openjdk-17-jdk wget unzip

# Android SDK location
ENV ANDROID_SDK_ROOT=/android-sdk
RUN mkdir -p $ANDROID_SDK_ROOT/cmdline-tools

# Download Android command line tools
RUN wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O cmdline-tools.zip

# Extract and move to correct structure
RUN unzip cmdline-tools.zip -d temp && \
    mv temp/cmdline-tools $ANDROID_SDK_ROOT/cmdline-tools/latest && \
    rm -rf temp cmdline-tools.zip

# Add tools to PATH
ENV PATH=$PATH:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools

# Accept licenses
RUN yes | sdkmanager --licenses
/usr/lib/jvm/java-17-openjdk-amd64
/android-sdk/cmdline-tools/latest
bubblewrap init --manifest twa-manifest.json
# Install Android packages
RUN sdkmanager \
    "platform-tools" \
    "platforms;android-34" \
    "build-tools;34.0.0"

# Install bubblewrap
RUN npm install -g @bubblewrap/cli

WORKDIR /app

# bubblewrap init --manifest="https://personal-finance-netrunner.netlify.app/manifest.json" [--directory="./buildapk"] [--chromeosonly] [--metaquest]