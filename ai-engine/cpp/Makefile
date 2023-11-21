# Compiler and compiler flags
CXX = g++
CXXFLAGS = -std=c++20 -g -Wall -Wextra -fsanitize=address -fsanitize=undefined -fno-sanitize-recover

# Source file and executable name
INCLUDES = -I./boost_1_83_0
DEPS = Game.h Utils.h Helpers.h CardQueue.h Search.h Score.h Hasher.h MoveOrderer.h
SOURCES = Game.cpp Utils.cpp Helpers.cpp Search.cpp Score.cpp

# Default target
all: debug

debug: Main TestGame TestSearch

build: CXXFLAGS += -O3
build: Main TestGame TestSearch

$(EXECUTABLES): %: %.o $(SOURCES:.cpp=.o)
	$(CXX) $(CXXFLAGS) $(INCLUDES) $^ -o $@

Main: Main.o $(SOURCES:.cpp=.o)
	$(CXX) $(CXXFLAGS) $(INCLUDES) $^ -o $@

TestGame: TestGame.o $(SOURCES:.cpp=.o)
	$(CXX) $(CXXFLAGS) $(INCLUDES) $^ -o $@

TestSearch: TestSearch.o $(SOURCES:.cpp=.o)
	$(CXX) $(CXXFLAGS) $(INCLUDES) $^ -o $@
	
%.o: %.cpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c $< -o $@

# Clean up object files and the executables
clean:
	rm -f $(EXECUTABLES)
	rm -f *.o