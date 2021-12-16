import { BufferGeometry, Vector3, CubicBezierCurve3, ShaderMaterial, Points } from "three";
export class FlyLine {
  addflyline = (minx, maxx, colorf2, colort2) => {
    let colorf = colorf2 || {
      r: 0.0,
      g: 0.0,
      b: 0.0
    };
    let colort = colort2 || {
      r: 1.0,
      g: 1.0,
      b: 1.0
    };
    const curve = new CubicBezierCurve3(
      new Vector3(minx, 0, minx),
      new Vector3(minx / 2, maxx % 70 + 100, maxx / 2),
      new Vector3(maxx / 2, maxx % 70 + 70, maxx / 2),
      new Vector3(maxx, 0, maxx)
    );
    const points = curve.getPoints((maxx - minx) * 5);
    const geometry = new BufferGeometry().setFromPoints(points);
    const material = this.createMaterial();
    const flyline = new Points(geometry, material);
    flyline.material.uniforms.time.value = minx;
    flyline.material.uniforms.colorf = {
      type: 'v3',
      value: new Vector3(colorf.r, colorf.g, colorf.b)
    };
    flyline.material.uniforms.colort = {
      type: 'v3',
      value: new Vector3(colort.r, colort.g, colort.b)
    };

    flyline.minx = minx;
    flyline.maxx = maxx;
    return flyline;
  }

  createMaterial = () => {
    const vertexShader = `
      uniform float time;
      uniform float size;
      varying vec3 iPosition;

      void main(){
        iPosition=vec3(position);
        float pointsize=1.;
        if(position.x>time && position.x<(time+size)){
          pointsize=(position.x-time)/size;
        }
        gl_PointSize=pointsize*3.;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
      }
    `;
    const fragmentShader = `
      uniform float time;
      uniform float size;
      uniform vec3 colorf;
      uniform vec3 colort;

      varying vec3 iPosition;

      void main(){
        float end=time+size;
        vec4 color;
        if(iPosition.x>end||iPosition.x<time){
          discard;
        }else if(iPosition.x>time&&iPosition.x<end){
          float step=fract((iPosition.x-time)/size);

          float dr=abs(colort.x-colorf.x);
          float dg=abs(colort.y-colorf.y);
          float db=abs(colort.z-colorf.z);

          float r=colort.x>colorf.x?(dr*step+colorf.x):(colorf.x-dr*step);
          float g=colort.y>colorf.y?(dg*step+colorf.y):(colorf.y-dg*step);
          float b=colort.z>colorf.z?(db*step+colorf.z):(colorf.z-db*step);

          color=vec4(r,g,b,1.);
        }

        float d=distance(gl_PointCoord,vec2(.5,.5));
        if(abs(iPosition.x-end)<.2||abs(iPosition.x-time)<.2){
          if(d>.5){
            discard;
          }
        }
        gl_FragColor=color;
      }
    `;
    // 配置着色器里的attribute变量
    const attribute = {};
    const uniforms = {
      time: {
        type: 'f',
        value: -70.0
      },
      size: { type: 'f', value: 20.0 }
    };

    const meshMaterial = new ShaderMaterial({
      uniforms,
      defaultAttributeValues: attribute,
      vertexShader,
      fragmentShader,
      transparent: true
    });
    return meshMaterial;
  }
}
