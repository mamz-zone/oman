# Extract face-circle crops (talking segments) and example-clip crops as image sequences at output 60fps timing.
import json,subprocess,numpy as np,os,sys
S=os.path.dirname(os.path.abspath(__file__))
SRC=sys.argv[1]
FPS_SRC=60000/1001; N_OUT=int(21.37*60)
face=json.load(open(f"{S}/work/face.json"))
EX0,EX1=5.205,11.094
# smooth face track over talking frames
xs=np.array([f[1] if f[1] is not None else np.nan for f in face]); ys=np.array([f[2] if f[2] is not None else np.nan for f in face])
t=np.arange(len(face))/FPS_SRC
talk=(t<EX0-0.02)|(t>EX1+0.02)
good=talk&~np.isnan(xs)&(np.abs(xs-0.57)<0.1)&(np.abs(ys-0.42)<0.08)
xi=np.interp(np.arange(len(xs)),np.where(good)[0],xs[good]); yi=np.interp(np.arange(len(ys)),np.where(good)[0],ys[good])
def smooth(a,k=45):
    w=np.hanning(k);w/=w.sum();p=np.pad(a,k,mode='edge');return np.convolve(p,w,'same')[k:-k]
xi=smooth(xi);yi=smooth(yi)
json.dump({"x":xi.tolist(),"y":yi.tolist()},open(f"{S}/work/face_smooth.json","w"))
print("face x range px",xi.min()*2160,xi.max()*2160,"y",yi.min()*3840,yi.max()*3840)
