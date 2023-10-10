# Engine Setup

To setup the correct socket.io packages:

```sh
# Install VCPKG in the ai-engine folder
git clone https://github.com/microsoft/vcpkg
.\vcpkg\bootstrap-vcpkg.bat

# Install socket.io
cd vcpkg
./bootstrap-vcpkg.sh
./vcpkg integrate install
vcpkg install socket-io-client
```

Find the socket.io C++ library here: [socket.io](https://github.com/socketio/socket.io-client-cpp/blob/master/INSTALL.md#with-cmake)

# Install C++
Make sure c++ is appropriately installed:
https://code.visualstudio.com/docs/cpp/config-mingw
