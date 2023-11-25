# Compiler and compiler flags
CXX = g++
CXXFLAGS = -std=c++20 -Wall -Wextra

# Source file and executable name
INCLUDES = # -I./boost_1_83_0
DEPS = Game.h Utils.h Helpers.h CardQueue.h Search.h Score.h Hasher.h MoveOrderer.h
SOURCES = Game.cpp Utils.cpp Helpers.cpp Search.cpp Score.cpp DynamicBitset.cpp

# I'd recommend installing cilk in the same directory.
# All the examples use this invocation.
UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S), Darwin)
 	RUNNER += xcrun
	CXX = /opt/opencilk/bin/clang++
	CXXFLAGS += -fopencilk
endif
ifeq ($(UNAME_S), Linux)
	CXX = /opt/opencilk/bin/clang++
	CXXFLAGS += -fopencilk
endif

# Add the following printout
$(info UNAME_S is $(UNAME_S))
$(info RUNNER is $(RUNNER))
$(info CXX is $(CXX))

# Default target
all: debug

debug: CXXFLAGS += -g -fsanitize=address -fsanitize=undefined -fno-sanitize-recover
debug: Main TestGame TestSearch TestGamePerf

# GCC profiling optimization generation
profile: CXXFLAGS += -fprofile-generate
profile: build

# GCC profiling optimization use
# idk how to check for file existence so just doing this for now
useprofile: clean # clear previous obj and executable files
useprofile: CXXFLAGS += -fprofile-use
useprofile: build

# default build
build: CXXFLAGS += -O3
build: Main TestGame TestSearch TestGamePerf


$(EXECUTABLES): %: %.o $(SOURCES:.cpp=.o)
	$(RUNNER) $(CXX) $(CXXFLAGS) $(INCLUDES) $^ -o $@

Main: Main.o $(SOURCES:.cpp=.o)
	$(RUNNER) $(CXX) $(CXXFLAGS) $(INCLUDES) $^ -o $@

TestGame: TestGame.o $(SOURCES:.cpp=.o)
	$(RUNNER) $(CXX) $(CXXFLAGS) $(INCLUDES) $^ -o $@

TestSearch: TestSearch.o $(SOURCES:.cpp=.o)
	$(RUNNER) $(CXX) $(CXXFLAGS) $(INCLUDES) $^ -o $@

TestGamePerf: TestGamePerf.o $(SOURCES:.cpp=.o)
	$(RUNNER) $(CXX) $(CXXFLAGS) $(INCLUDES) $^ -o $@

DynamicBitset: DynamicBitset.o
	$(RUNNER) $(CXX) $(CXXFLAGS) $(INCLUDES) $^ -o $@
	
%.o: %.cpp
	$(RUNNER) $(CXX) $(CXXFLAGS) $(INCLUDES) -c $< -o $@

# Clean up object files and the executables
clean:
	rm -f $(EXECUTABLES)
	rm -f *.o