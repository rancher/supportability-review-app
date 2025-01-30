<template>
  <div>
    <div class="main-heading">Summary by Review Vector</div>
    <div class="container">
      <div class="chart" v-for="(value, index) in getData()" :key="index">
        <div class="heading">{{ value.title }}</div>
        <div class="doughnut-chart">
          <div class="doughnut" :style="getDoughnutStyle(value)" />
          <div class="center-text">
            <p>{{ value.total }}</p>
          </div>

          <div
            v-if="value.pass > 0"
            class="text-overlay green-text"
            :style="getTextOverlayStyle('green', value.pass, value.total, 0)">
            <p>{{ value.pass }}</p>
            <p>({{ getPercentage(value.pass, value.total) }})%</p>
          </div>

          <div
            v-if="value.fail > 0"
            class="text-overlay red-text"
            :style="getTextOverlayStyle('red', value.fail, value.total, value.pass)">
            <p>{{ value.fail }}</p>
            <p>({{ getPercentage(value.fail, value.total) }})%</p>
          </div>

          <div
            v-if="value.warn > 0"
            class="text-overlay yellow-text"
            :style="getTextOverlayStyle('yellow', value.warn, value.total, value.pass + value.fail)">
            <p>{{ value.warn }}</p>
            <p>({{ getPercentage(value.warn, value.total) }})%</p>
          </div>

          <div
            v-if="value.skip > 0"
            class="text-overlay blue-text"
            :style="getTextOverlayStyle('blue', value.skip, value.total, value.pass + value.fail + value.warn)">
            <p>{{ value.skip }}</p>
            <p>({{ getPercentage(value.skip, value.total) }})%</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'VectorsInfoWidgetDoughnut',
  props: {
    info: {
      type: Map,
      required: true
    }
  },
  methods: {
    getData() {
      const d = []
      this.info.forEach((v, k) => {
        d.push({
          title: k,
          total: v.checks_total,
          pass: v.checks_pass,
          fail: v.checks_fail,
          warn: v.checks_warn,
          skip: v.checks_skip
        })
      })
      return d
    },
    getDoughnutStyle(value) {
      const total = value.total || 1 // Prevent division by zero
      const passPercent = (value.pass / total) * 100
      const failPercent = (value.fail / total) * 100
      const warnPercent = (value.warn / total) * 100
      const skipPercent = (value.skip / total) * 100

      // Return CSS for the doughnut background
      return {
        background: `conic-gradient(
          #2eb85c 0% ${passPercent}%,
          #e55353 ${passPercent}% ${passPercent + failPercent}%,
          #f9b115 ${passPercent + failPercent}% ${passPercent + failPercent + warnPercent}%,
          #8a93a2 ${passPercent + failPercent + warnPercent}% 100%
        )`
      }
    },
    getTextOverlayStyle(color, value, total, prevValue) {
      if (value === 0) {
        return {}
      }
      const totalPercent = (value / total) * 100
      const startAngle = (prevValue / total) * 360
      const endAngle = startAngle + (totalPercent / 100) * 360
      const midAngle = (startAngle + endAngle) / 2
      const offset = 90

      // Convert angle to radians for positioning
      const radians = (midAngle - offset) * (Math.PI / 180)
      const x = Math.cos(radians) * 70
      const y = Math.sin(radians) * 70

      return {
        color: this.getTextColor(color),
        position: 'absolute',
        top: `calc(50% + ${y}px)`,
        left: `calc(50% + ${x}px)`,
        fontSize: '12px',
        transform: 'translate(-50%, -50%)',
        zIndex: 3
      }
    },
    getTextColor(color) {
      return '#000'
    },
    getPercentage(value, total) {
      const percentage = ((value / total) * 100).toFixed(0)
      return percentage
    }
  }
}
</script>

<style scoped>
.main-heading {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  margin-left: 30px;
  margin-top: 20px;
  margin-bottom: 10px;
}

.container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  justify-items: center;
  padding: 20px;
  margin-bottom: 20px;
  height: 260px;
}
.heading {
  font-weight: bold;
  font-size: 14px;
  color: #333;
  margin-bottom: 10px;
  white-space: nowrap;
  overflow: visible;
  margin-left: -10px;
}

.chart {
  width: 190px;
  height: 190px;
  text-align: center;
  margin: 0px;
}

.doughnut-chart {
  position: relative;
  width: 190px;
  height: 190px;
  border-radius: 50%;
  margin: 0 auto;
  margin-top: 20px;
}

.doughnut {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: conic-gradient(#2eb85c 0% 25%, #e55353 25% 50%, #f9b115 50% 75%, #8a93a2 75% 100%);
}

.doughnut-chart::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 50%;
  height: 50%;
  background-color: #f1f1f1;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
}

.center-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 16px;
  font-weight: bold;
  color: black;
  z-index: 2;
}

.center-text p {
  margin: 0;
  padding: 0;
  font-size: 20px;
}

.text-overlay {
  position: absolute;
  font-size: 14px;
  font-weight: bold;
  pointer-events: none;
  z-index: 3;
}

.green-text {
  color: #2eb85c;
}
.red-text {
  color: #e55353;
}
.yellow-text {
  color: #f9b115;
}
.blue-text {
  color: #8a93a2;
}
</style>
