import subprocess,json,sys,numpy as np, mediapipe as mp
from mediapipe.tasks import python as mpt
from mediapipe.tasks.python import vision
src,model,out=sys.argv[1:4]
W,H=540,960
det=vision.FaceDetector.create_from_options(vision.FaceDetectorOptions(base_options=mpt.BaseOptions(model_asset_path=model),min_detection_confidence=0.4))
p=subprocess.Popen(["ffmpeg","-v","error","-i",src,"-vf",f"scale={W}:{H}","-f","rawvideo","-pix_fmt","rgb24","-"],stdout=subprocess.PIPE)
res=[];i=0
while True:
    b=p.stdout.read(W*H*3)
    if len(b)<W*H*3:break
    img=mp.Image(image_format=mp.ImageFormat.SRGB,data=np.frombuffer(b,np.uint8).reshape(H,W,3))
    r=det.detect(img)
    if r.detections:
        d=max(r.detections,key=lambda d:d.bounding_box.width)
        bb=d.bounding_box
        res.append([i,(bb.origin_x+bb.width/2)/W,(bb.origin_y+bb.height/2)/H,bb.width/W,bb.height/H])
    else: res.append([i,None,None,None,None])
    i+=1
json.dump(res,open(out,"w"))
print(i,"frames", sum(1 for r in res if r[1] is not None),"detected")
