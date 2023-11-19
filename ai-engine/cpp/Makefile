# Compiler and compiler flags
CXX = g++
CXXFLAGS = -std=c++20 -Wall -Wextra -fsanitize=address -fsanitize=address -fsanitize=undefined -fno-sanitize-recover

# Source file and executable name
INCLUDES = -I./boost_1_83_0
DEPS = Game.h Utils.h Helpers.h CardQueue.h Search.h Score.h Hasher.h MoveOrderer.h
EXECUTABLES = Main TestGame TestSearch

# Default target
all: debug

debug: CXXFLAGS += -g
debug: $(EXECUTABLES)

build: CXXFLAGS += -O3
build: $(EXECUTABLES)

$(EXECUTABLES): %: %.o
	$(CXX) $(CXXFLAGS) $(INCLUDES) $< -o $@

%.o: %.cpp $(DEPS)
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c $< -o $@

# Clean up object files and the executable
clean:
	rm -f $(EXECUTABLES)
	rm -f *.o