import { useEffect, useRef, useState, useCallback } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

const HOLD_FRAMES = 30;
const LEFT_FRAMES = 1;
const RIGHT_FRAMES = 1;
const YAW_THRESHOLD = 0.03;

const MASK_WIDTH = 260;
const MASK_HEIGHT = 360;
const SCAN_SPEED = 2;

const FaceLiveness = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanXRef = useRef(0);

  const [stage, setStage] = useState("center");
  const [stageStatus, setStageStatus] = useState("pending");
  const [direction, setDirection] = useState("CENTER");

  const [centerHold, setCenterHold] = useState(0);
  const [leftHold, setLeftHold] = useState(0);
  const [rightHold, setRightHold] = useState(0);

  const expectedDirection = {
    center: "CENTER",
    left: "LEFT",
    right: "RIGHT",
  }[stage];

  /* ------------------- STAGE TRANSITIONS ------------------- */
  useEffect(() => {
    if (stage === "center" && centerHold >= HOLD_FRAMES) {
      setTimeout(() => {
        setStage("left");
        resetHolds();
      }, 400);
    }

    if (stage === "left" && leftHold >= LEFT_FRAMES) {
      setTimeout(() => {
        setStage("right");
        resetHolds();
      }, 400);
    }

    if (stage === "right" && rightHold >= RIGHT_FRAMES) {
      setTimeout(() => {
        setStage("complete");
      }, 400);
    }
  }, [centerHold, leftHold, rightHold, stage]);

  const resetHolds = () => {
    setCenterHold(0);
    setLeftHold(0);
    setRightHold(0);
    setStageStatus("pending");
  };

  /* ------------------- FACE MESH RESULTS ------------------- */
  const onResults = useCallback(
    (results) => {
      if (!results.multiFaceLandmarks?.length) {
        setStageStatus("pending");
        return;
      }

      const landmarks = results.multiFaceLandmarks[0];
      const nose = landmarks[1];
      const leftEye = landmarks[33];
      const rightEye = landmarks[263];

      const yaw = (nose.x - leftEye.x) - (rightEye.x - nose.x);

      let currentDirection = "CENTER";
      if (yaw > YAW_THRESHOLD) currentDirection = "RIGHT";
      else if (yaw < -YAW_THRESHOLD) currentDirection = "LEFT";

      setDirection(currentDirection);

      if (currentDirection !== expectedDirection) {
        setStageStatus("pending");
        resetHolds();
        return;
      }

      setStageStatus("success");

      if (stage === "center") setCenterHold((v) => v + 1);
      if (stage === "left") setLeftHold((v) => v + 1);
      if (stage === "right") setRightHold((v) => v + 1);
    },
    [stage, expectedDirection]
  );

  /* ------------------- MEDIAPIPE INIT ------------------- */
  useEffect(() => {
    const faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });

    faceMesh.onResults(onResults);

    let camera;
    if (videoRef.current) {
      camera = new Camera(videoRef.current, {
        onFrame: async () => {
          await faceMesh.send({ image: videoRef.current });
        },
        width: 640,
        height: 480,
      });
      camera.start();
    }

    return () => camera && camera.stop();
  }, [onResults]);



  /* ------------------- SCANNER DRAW ------------------- */
  const drawScanner = (ctx, canvas, status) => {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const maskX = cx - MASK_WIDTH / 2;
    const maskY = cy - MASK_HEIGHT / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grey overlay
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Cut hole
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.ellipse(cx, cy, MASK_WIDTH / 2, MASK_HEIGHT / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Outline
    ctx.strokeStyle = "lightGrey";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, MASK_WIDTH / 2, MASK_HEIGHT / 2, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Scanner animation
    scanXRef.current += SCAN_SPEED;
    if (scanXRef.current > MASK_WIDTH) scanXRef.current = 0;

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, MASK_WIDTH / 2, MASK_HEIGHT / 2, 0, 0, Math.PI * 2);
    ctx.clip();

    ctx.strokeStyle =
      status === "success"
        ? "rgba(34,197,94,0.9)"
        : "rgba(239,68,68,0.9)";

    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(maskX + scanXRef.current, maskY + 20);
    ctx.lineTo(maskX + scanXRef.current, maskY + MASK_HEIGHT - 20);
    ctx.stroke();

    ctx.restore();
  };

  /* ------------------- ANIMATION LOOP ------------------- */
  useEffect(() => {
    let raf;
    const animate = () => {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        drawScanner(ctx, canvasRef.current, stageStatus);
      }
      raf = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(raf);
  }, [stageStatus]);

  return (
    <div style={{ position: "relative", width: 640, height: 480 }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />

      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        style={{ position: "absolute", inset: 0 }}
      />

      <div
        style={{
          position: "absolute",
          top: 20,
          width: "100%",
          textAlign: "center",
          color: "white",
          fontSize: 18,
          fontWeight: "bold",
        }}
      >
        {stage === "center" && "📍 Look straight"}
        {stage === "left" && "⬅️ Turn your head LEFT"}
        {stage === "right" && "➡️ Turn your head RIGHT"}
        {stage === "complete" && "✅ Liveness Check Completed"}
      </div>

      {stage === "complete" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 26,
            fontWeight: "bold",
          }}
        >
          ✅ Liveness Check Passed
        </div>
      )}
    </div>
  );
};

export default FaceLiveness;
