import json,subprocess,numpy as np,os,sys,cv2
S=os.path.dirname(os.path.abspath(__file__)); SRC=sys.argv[1]
W,H=2160,3840; FS=60000/1001; N=int(round(21.37*60))
fs=json.load(open(f"{S}/work/face_smooth.json"))
for d in ["face","ex","exbg"]: os.makedirs(f"{S}/seq/{d}",exist_ok=True)
EX0,EX1=5.205,11.094
p=subprocess.Popen(["ffmpeg","-v","error","-i",SRC,"-f","rawvideo","-pix_fmt","rgb24","-"],stdout=subprocess.PIPE,bufsize=W*H*3*2)
src_idx=-1; frame=None; FACE=1400; OUTF=1120
for i in range(N):
    t=i/60; want=min(int(round(t*FS)),len(fs["x"])-1)
    while src_idx<want:
        b=p.stdout.read(W*H*3)
        if len(b)<W*H*3: break
        frame=np.frombuffer(b,np.uint8).reshape(H,W,3); src_idx+=1
    bgr=cv2.cvtColor(frame,cv2.COLOR_RGB2BGR)
    talking = t<EX0+0.6 or t>EX1-0.6
    if talking:
        cx=fs["x"][want]*W; cy=fs["y"][want]*H+20
        x0=int(round(cx-FACE/2)); y0=int(round(cy-FACE/2))
        x0=max(0,min(W-FACE,x0)); y0=max(0,min(H-FACE,y0))
        c=cv2.resize(bgr[y0:y0+FACE,x0:x0+FACE],(OUTF,OUTF),interpolation=cv2.INTER_AREA)
        cv2.imwrite(f"{S}/seq/face/{i:05d}.jpg",c,[cv2.IMWRITE_JPEG_QUALITY,97])
    if EX0-0.05<=t<=EX1+0.05:
        y0,y1=1376,2466; cw=1744; x0=1085-cw//2
        c=bgr[y0:y1,x0:x0+cw]
        cv2.imwrite(f"{S}/seq/ex/{i:05d}.jpg",cv2.resize(c,(1792,1120),interpolation=cv2.INTER_CUBIC),[cv2.IMWRITE_JPEG_QUALITY,97])
        bg=cv2.GaussianBlur(cv2.resize(bgr[y0:y1,32:2138],(240,126),interpolation=cv2.INTER_AREA),(0,0),6)
        cv2.imwrite(f"{S}/seq/exbg/{i:05d}.jpg",bg,[cv2.IMWRITE_JPEG_QUALITY,92])
    if i%200==0: print(i,flush=True)
p.kill()
print("done")
