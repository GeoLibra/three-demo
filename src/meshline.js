import { BufferGeometry, Line, LineBasicMaterial, Vector3, CatmullRomCurve3 } from "three";

export class FlyByMeshLine {
  constructor() {
    this.curveModelData = null;
    this.curve = null;
    this.tween = null;
  }

  createFlyLine = (startPoint, endPoint, heightLimit, flyTime, lineStyle) => {
    const middleCurvePositionX = (startPoint.x + endPoint.x) / 2
    const middleCurvePositionY = heightLimit
    const middleCurvePositionZ = (startPoint.z + endPoint.z) / 2
    const curveData = new CatmullRomCurve3([
      new Vector3(startPoint.x, startPoint.y, startPoint.z),
      new Vector3(middleCurvePositionX, middleCurvePositionY + 20, middleCurvePositionZ),
      new Vector3(endPoint.x, endPoint.y, endPoint.z)
    ])
    this.curveModelData = curveData.getPoints(50)
    const curveGeometry = new BufferGeometry()
    curveGeometry.setFromPoints(this.curveModelData.slice(0, 1));
    const curveMaterial = new LineBasicMaterial({ color: lineStyle.color, linewidth: lineStyle.linewidth })
    this.curve = new Line(curveGeometry, curveMaterial)
    return this.curve
  }

}
