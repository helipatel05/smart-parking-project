import gradio as gr
from roboflow import Roboflow

rf = Roboflow(api_key="PASTE_YOUR_API_KEY_HERE")
model = rf.workspace().project("vehicle-m8hh0").version(1).model

def detect(image):
    result = model.predict(image.name).json()
    return str(result)

interface = gr.Interface(fn=detect, inputs=gr.Image(type="filepath"), outputs="text")
interface.launch()
