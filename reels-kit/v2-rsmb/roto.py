import mediapipe as mp, numpy as np, cv2, json, sys
from mediapipe.tasks import python as mpt
from mediapipe.tasks.python import vision
img=cv2.imread(sys.argv[1]); h,w=img.shape[:2]
small=cv2.resize(img,(w//4,h//4))
seg=vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(base_options=mpt.BaseOptions(model_asset_path=sys.argv[2]),output_confidence_masks=True))
r=seg.segment(mp.Image(image_format=mp.ImageFormat.SRGB,data=cv2.cvtColor(small,cv2.COLOR_BGR2RGB)))
m=r.confidence_masks[0].numpy_view()
m=(cv2.GaussianBlur(m,(0,0),2)>0.5).astype(np.uint8)
cs,_=cv2.findContours(m,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE); c=max(cs,key=cv2.contourArea)
c=cv2.approxPolyDP(c,1.5,True).reshape(-1,2)
pts=(c/[m.shape[1],m.shape[0]]).round(4).tolist()
json.dump(pts,open(sys.argv[3],'w')); print(len(pts),'pts', m.mean())
dbg=small.copy(); cv2.polylines(dbg,[c],True,(0,255,140),2); cv2.imwrite(sys.argv[4],dbg)
