import cv2,numpy as np,os,json,glob
S=os.path.dirname(os.path.abspath(__file__))
files=sorted(glob.glob(f"{S}/seq/ex/*.jpg")); idx=[int(os.path.basename(f)[:5]) for f in files]
G=[cv2.cvtColor(cv2.imread(f),cv2.COLOR_BGR2GRAY) for f in files]
K=20; mask=np.zeros_like(G[K]); mask[540:960,740:1160]=255
F0=cv2.goodFeaturesToTrack(G[K],300,0.005,10,mask=mask)
lk=dict(winSize=(31,31),maxLevel=3,criteria=(cv2.TERM_CRITERIA_EPS|cv2.TERM_CRITERIA_COUNT,40,0.01))
NX=NY=7; xs=np.linspace(690,1210,NX); ys=np.linspace(490,1010,NY)
grid=np.array([[x,y] for y in ys for x in xs],np.float32).reshape(-1,1,2)
H={K:np.eye(3)}
for rng,b in [(range(K,len(G)-1),1),(range(K,0,-1),-1)]:
    p=F0.copy(); Hc=np.eye(3); ref=F0.copy()
    for i in rng:
        n,st,_=cv2.calcOpticalFlowPyrLK(G[i],G[i+b],p,None,**lk)
        b2,st2,_=cv2.calcOpticalFlowPyrLK(G[i+b],G[i],n,None,**lk)
        ok=(st.ravel()==1)&(np.linalg.norm((b2-p).reshape(-1,2),axis=1)<1.0)
        if ok.sum()<12:
            H[i+b]=H[i]; continue
        Hm,inl=cv2.findHomography(ref[ok],n[ok],cv2.RANSAC,3.0)
        H[i+b]=Hm
        # re-seed with inliers only
        keep=ok.copy(); keep[np.where(ok)[0][inl.ravel()==0]]=False
        p=n[keep]; ref=ref[keep]
        if len(p)<60:
            Hinv=np.linalg.inv(Hm); m2=np.zeros_like(G[i+b]); poly=cv2.perspectiveTransform(np.array([[[740,540]],[[1160,540]],[[1160,960]],[[740,960]]],np.float32),Hm).astype(np.int32)
            cv2.fillPoly(m2,[poly.reshape(-1,2)],255); newp=cv2.goodFeaturesToTrack(G[i+b],300,0.005,10,mask=m2)
            p=newp; ref=cv2.perspectiveTransform(newp,Hinv)
arr=np.array([cv2.perspectiveTransform(grid,H[i]).reshape(-1,2) for i in range(len(G))])
k=7;w=np.hanning(k+2)[1:-1];w/=w.sum(); pad=np.pad(arr,((k//2,k//2),(0,0),(0,0)),mode='edge')
sm=sum(w[j]*pad[j:j+len(arr)] for j in range(k))
json.dump({"nx":NX,"ny":NY,"frames":{str(i):(sm[n]/[1792,1120]).round(5).tolist() for n,i in enumerate(idx)}},open(f"{S}/work/meshtrack.json","w"))
print("motion range px",np.ptp(arr[:,:,0]),np.ptp(arr[:,:,1]))
ims=[]
for fi in [0,180,330]:
    im=cv2.imread(files[fi])
    for q in sm[fi]: cv2.circle(im,tuple(int(v) for v in q),9,(0,255,140),-1)
    ims.append(cv2.resize(im,(598,374)))
cv2.imwrite(f"{S}/frames/trackdbg.jpg",np.hstack(ims))
