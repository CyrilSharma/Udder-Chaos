# Compiler and compiler flags
CC = g++
CFLAGS = -std=c++17 -Wall

# Source file and executable name
SOURCE = TestGame.cpp
EXECUTABLE = Test

# Default target
all: $(EXECUTABLE)

test: $(EXECUTABLE)
	./$(EXECUTABLE)

# Compile the source file
$(EXECUTABLE): $(SOURCE)
	$(CC) $(CFLAGS) -o $(EXECUTABLE) $(SOURCE)

# Clean up object files and the executable
clean:
	rm -f $(EXECUTABLE)