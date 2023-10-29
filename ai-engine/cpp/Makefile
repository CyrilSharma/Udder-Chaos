# Compiler and compiler flags
CC = g++
CFLAGS = -std=c++17 -Wall -Wextra
DEBUG_FLAGS = -g
OPTIMIZED_FLAGS = -O3

# Source file and executable name
LIBS = boost_1_83_0
DEPS = Game.h Utils.h Helpers.h CardQueue.h
SOURCE = TestGame.cpp
EXECUTABLE = Test

# Default target
all: debug

debug: $(SOURCE) $(DEPS)
	$(CC) $(CFLAGS) $(DEBUG_FLAGS) -I $(LIBS) -o $(EXECUTABLE) $(SOURCE)

build: $(SOURCE) $(DEPS)
	$(CC) $(CFLAGS) $(OPTIMIZED_FLAGS) -I $(LIBS) -o $(EXECUTABLE) $(SOURCE)

# Clean up object files and the executable
clean:
	rm -f $(EXECUTABLE)