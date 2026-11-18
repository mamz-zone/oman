import json,sys,wave,numpy as np
from faster_whisper import WhisperModel
m=WhisperModel("large-v3",device="cpu",compute_type="int8")
wf=wave.open(sys.argv[1]);a=np.frombuffer(wf.readframes(wf.getnframes()),np.int16).astype(np.float32)/32768
prompt=open(sys.argv[3]).read().replace("\n"," ")[:800]
segs,_=m.transcribe(a,language="ar",word_timestamps=True,beam_size=5,initial_prompt=prompt,condition_on_previous_text=False)
out=[]
for s in segs:
    print(f"[{s.start:.2f}-{s.end:.2f}] {s.text}")
    out.append({"start":s.start,"end":s.end,"text":s.text,"words":[{"w":w.word,"s":w.start,"e":w.end,"p":w.probability} for w in s.words]})
json.dump(out,open(sys.argv[2],"w"),ensure_ascii=False,indent=1)
