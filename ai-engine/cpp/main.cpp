#include <iostream>
#include <socket-io-client>

int main() {
    sio::client h;
    h.connect("http://127.0.0.1:3000");

    std::cout << "Hello, world!" << std::endl;
    return 0;
}