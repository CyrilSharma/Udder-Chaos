# Compiler and compiler flags
CXX = g++
CXXFLAGS = -std=c++20 -Wall -Wextra -fsanitize=address -fsanitize=address -fsanitize=undefined -fno-sanitize-recover

# Source file and executable name
INCLUDES = -I./boost_1_83_0
DEPS = Game.h Utils.h Helpers.h CardQueue.h Search.h Score.h
# EXECUTABLES = TestSearch
EXECUTABLES = Main TestGame
# EXECUTABLES = TestGame
# Default target
all: debug

debug: CXXFLAGS += -g
debug: $(EXECUTABLES)

build: CXXFLAGS += -O3
build: $(EXECUTABLES)

$(EXECUTABLES): %: %.cpp $(DEPS)
	$(CXX) $(CXXFLAGS) $(INCLUDES) -o $@ $<

# Clean up object files and the executable
clean:
	rm -f $(EXECUTABLE)