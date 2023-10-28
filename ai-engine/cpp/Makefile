# Compiler and compiler flags
CC = g++
CFLAGS = -g -std=c++17 -Wall

# Source file and executable name
LIBS = boost_1_83_0
DEPS = Game.h Utils.h Helpers.h CardQueue.h
SOURCE = TestGame.cpp
EXECUTABLE = Test

# Default target
all: $(EXECUTABLE)

# Compile the source file
$(EXECUTABLE): $(SOURCE) $(DEPS)
	$(CC) $(CFLAGS) -I $(LIBS) -o $(EXECUTABLE) $(SOURCE)

# Clean up object files and the executable
clean:
	rm -f $(EXECUTABLE)