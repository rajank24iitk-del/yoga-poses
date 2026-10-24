import * as tf from '@tensorflow/tfjs'

const LEFT_HIP = 11
const RIGHT_HIP = 12
const LEFT_SHOULDER = 5
const RIGHT_SHOULDER = 6

function centerPoint(landmarks, leftIndex, rightIndex) {
  const left = tf.gather(landmarks, leftIndex, 1)
  const right = tf.gather(landmarks, rightIndex, 1)
  return tf.add(tf.mul(left, 0.5), tf.mul(right, 0.5))
}

function poseSize(landmarks) {
  const hips = centerPoint(landmarks, LEFT_HIP, RIGHT_HIP)
  const shoulders = centerPoint(landmarks, LEFT_SHOULDER, RIGHT_SHOULDER)
  const torso = tf.norm(tf.sub(shoulders, hips))
  let poseCenter = centerPoint(landmarks, LEFT_HIP, RIGHT_HIP)
  poseCenter = tf.expandDims(poseCenter, 1)
  poseCenter = tf.broadcastTo(poseCenter, [1, 17, 2])
  const shifted = tf.gather(tf.sub(landmarks, poseCenter), 0, 0)
  const maxDist = tf.max(tf.norm(shifted, 'euclidean', 0))
  return tf.maximum(tf.mul(torso, 2.5), maxDist)
}

export function embedKeypoints(coords) {
  return tf.tidy(() => {
    let landmarks = tf.tensor(coords, [17, 2])
    landmarks = tf.expandDims(landmarks, 0)
    let poseCenter = centerPoint(landmarks, LEFT_HIP, RIGHT_HIP)
    poseCenter = tf.expandDims(poseCenter, 1)
    poseCenter = tf.broadcastTo(poseCenter, [1, 17, 2])
    landmarks = tf.sub(landmarks, poseCenter)
    landmarks = tf.div(landmarks, poseSize(landmarks))
    return tf.reshape(landmarks, [1, 34])
  })
}

export async function scoreClassicPose(model, keypoints) {
  const embedding = embedKeypoints(keypoints.map((point) => [point.x, point.y]))
  const output = model.predict(embedding)
  const scores = await output.data()
  embedding.dispose()
  output.dispose()
  return Array.from(scores)
}
