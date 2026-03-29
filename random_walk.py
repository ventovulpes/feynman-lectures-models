from matplotlib import pyplot
import random

NUM_STEPS = 100
NUM_TRIALS = 10

trials = []
for _ in range(NUM_TRIALS):
    trials.append([0])
    cur_position = 0
    for _ in range(NUM_STEPS):
        if random.randint(0, 1) == 0:
            cur_position -= 1
        else:
            cur_position += 1

        trials[-1].append(cur_position)

for i in range(len(trials)):
    pyplot.plot(trials[i])
pyplot.show()