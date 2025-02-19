<template>
  <div class="main-container">
    <!-- Navigation Bar -->
    <nav class="navbar">
      <ul>
        <li
          v-for="(section, index) in sections"
          :key="index"
          :class="{ active: activeSection === index }"
          @click="scrollToSection(index)">
          {{ section.title }}
        </li>
      </ul>
    </nav>

    <!-- Scrollable Content -->
    <div class="content" @scroll="handleScroll">
      <div
        v-for="(section, index) in sections"
        :key="index"
        :id="section.id"
        :ref="'section' + index"
        class="section row">
        <div class="icon">
          <img src="../images/security.png" alt="icon" />
        </div>
        <div class="progress-section">
          <div class="progress-text">
            {{ vectorData?.get(section.title)?.checks_pass }}
            <span class="progress-text-half">/{{ vectorData?.get(section.title)?.checks_total }}</span>
          </div>
          <div class="progress-bar">
            <div
              class="progress"
              :style="{
                width:
                  (vectorData?.get(section.title)?.checks_pass / vectorData?.get(section.title)?.checks_total) * 100 +
                  '%'
              }"></div>
          </div>
        </div>

        <h3 class="heading">{{ section.title }}</h3>
        <p class="description">{{ section.description }}</p>
        <div class="info-box">
          <span>
            Find what is missing in
            <a href="#" class="link">{{ section.title }}</a>
            .
          </span>
        </div>
        <div class="cards">
          <template v-if="filteredCards(section.title).length > 0">
            <div
              v-for="card in filteredCards(section.title)"
              :key="card.id"
              class="card"
              :class="getCardClass(card.state)">
              <p class="label">{{ card.label }}</p>
              <p class="card-details">{{ card.details }}</p>
            </div>
          </template>

          <div v-else class="card wao-card">
            <p class="card-details">Everything in {{ section.title }} is properly configured.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Maincontent',
  props: {
    vectorData: {
      type: Object,
      required: true
    },
    cards: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      sections: [
        {
          id: 'security',
          title: 'Security',
          description:
            'Safeguarding infrastructure from vulnerabilities and cyber threats by ensuring mitigations, certificate validity, and enforcing best practices.'
        },
        {
          id: 'operational-best-practice',
          title: 'Operational Best Practice',
          description: 'Ensuring efficient and optimal operational strategies for better system management.'
        },
        {
          id: 'design-validation',
          title: 'Design Validation',
          description: 'Validating system design for compliance with industry standards and best practices.'
        },
        {
          id: 'support-matrix-conformance',
          title: 'Support Matrix Conformance',
          description: 'Ensuring the system meets the required support matrix for compatibility and performance.'
        }
      ],
      activeSection: 0
    };
  },
  methods: {
    filteredCards(vectorCategory) {
      let failCount = 0;
      let warnCount = 0;

      return this.cards
        .filter((card) => card.vector === vectorCategory)
        .slice(0, 5)
        .map((card) => {
          if (card.state === 'fail') {
            failCount++;
            return { ...card, label: `Failure #${failCount}` };
          } else if (card.state === 'warn') {
            warnCount++;
            return { ...card, label: `Warning #${warnCount}` };
          }
          return card;
        });
    },
    getCardClass(state) {
      if (state === 'fail') return 'failure';
      if (state === 'warn') return 'warning';
      return '';
    },
    handleScroll() {
      const sections = this.sections.map((_, index) => this.$refs['section' + index][0].getBoundingClientRect().top);

      let activeIndex = sections.findIndex((top) => top >= 0 && top < window.innerHeight / 2);
      if (activeIndex !== -1) {
        this.activeSection = activeIndex;
      }
    },
    scrollToSection(index) {
      this.$refs['section' + index][0].scrollIntoView({ behavior: 'smooth' });
    }
  }
};
</script>

<style scoped>
.main-container {
  flex: 1;
  overflow-y: auto;
  background-color: #efeaea;
  height: 100%;
  box-sizing: border-box;
  border: 0.1px solid rgb(10, 0, 10);
}
.navbar {
  position: sticky;
  top: 0;
  background-color: #1e293b;
  padding: 6px 0;
  z-index: 0; /* Keeps the navbar on top of other elements */
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  border: 0px solid rgb(74, 212, 143);
}

.navbar ul {
  display: flex;
  justify-content: center;
  gap: 24px;
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.navbar li {
  cursor: pointer;
  padding: 8px 16px;
  font-size: 17px;
  color: #e2e8f0; /* Light Grayish Blue */
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
  border-radius: 6px;
}

.navbar li:hover {
  background-color: #334155; /* Muted Blue Gray */
  color: #ffffff;
}
.navbar li.active {
  background-color: #475569; /* Deep Grayish Blue */
  color: #ffffff;
  font-weight: 600;
  border-bottom: 1px solid #94a3b8;
}

.content {
  border: 0px solid rgb(74, 212, 143);
  height: 100%;
  overflow-y: scroll;
  background: #222;
}

.row {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #efeaea;
  padding: 50px;
  padding-top: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 0.5px solid rgb(200, 49, 198);
}

.icon img {
  margin-top: 35px;
  margin-bottom: 30px;
  height: 110px;
}

.progress-section {
  width: 300px;
  text-align: center;
  border: 0px solid rgb(189, 35, 186);
}

.progress-bar {
  width: 100%;
  height: 15px;
  background-color: #ddd;
  border-radius: 5px;
  overflow: hidden;
  margin: 5px 0;
  border: 0px solid rgb(68, 204, 34);
}

.progress {
  height: 100%;
  background-color: rgb(19, 123, 45);
  border-radius: 5px;
}

.progress-text {
  font-size: 48px;
  font-weight: 700;
  font-family: Helvetica, Arial, sans-serif;
  color: rgb(19, 123, 45);
  border: 0px solid rgb(118, 194, 19);
  display: inline;
}

.progress-text-half {
  font-size: 32px;
  font-weight: 900;
  font-family: sans-serif;
  color: #105;
  margin-left: -10px;
  padding-left: 0px;
  border: 0px solid rgb(118, 194, 19);
}

.heading {
  font-size: 40px;
  font-weight: 700;
  font-family: Arial, Helvetica, sans-serif;
  margin: 5px 0 20px 0;
  color: #333;
  border: 0px solid rgb(65, 50, 198);
}

.description {
  width: 600px;
  font-size: 18px;
  color: #000;
  text-align: center;
  margin-bottom: 30px;
}

.info-box {
  font-size: 18px;
  padding: 10px 15px;
  border: 1px solid #17629f;
  color: #000;
  background: rgb(142, 209, 208);
  border-radius: 50px 10px;
  text-align: center;
}

.info-box .link {
  color: #2196f3;
  text-decoration: none;
  font-weight: bold;
}

.info-box .link:hover {
  text-decoration: underline;
}

.cards {
  color: black;
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 30px;
}

.card {
  background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
  border-radius: 20px 20px;
  padding: 10px;
  width: 160px;
  height: 180px;
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.1),
    0 6px 20px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.3s,
    box-shadow 0.3s;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow:
    0 6px 12px rgba(0, 0, 0, 0.2),
    0 8px 25px rgba(0, 0, 0, 0.2);
  background: linear-gradient(135deg, #f5f7fa, #9eb2d1);
}

.card-heading {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 10px;
  color: #2c3e50;
}

.label {
  font-size: 14px;
  font-weight: bold;
  color: #34495e;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.card-details {
  font-size: 16px;
  line-height: 1.6;
  color: #4a4a4a;
  margin: 5px 0;
}
.card.failure {
  border: 2px solid #f44336;
  box-shadow: inset 0px 0px 15px rgba(244, 67, 54, 0.5);
}

.card.warning {
  border: 2px solid #ff9800;
  box-shadow: inset 0px 0px 25px rgba(255, 152, 0, 0.5);
}

.wao-card {
  border: 2px solid green;
  box-shadow: inset 0px 0px 25px rgba(0, 128, 0, 0.5);
}
</style>
