from ana5 import *
import random
bad=[(P[s]['a'],'|',ban(s,10)['st'],B[s]['result_distance']) for s in fq if ban(s,10) and not concord([ban(s,10)['st']],P[s]['a'])[0]]
random.seed(2); random.shuffle(bad)
for b in bad[:25]: print(*b)
