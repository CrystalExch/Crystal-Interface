import React, { useState, useEffect, useRef } from 'react';
import './ChallengeIntro.css';
import part1image from '../../assets/spreaddemo.png';
import defaultProfilePic from '../../assets/bh.png';
import LeaderboardPfp2 from '../../assets/legion.png';
import LeaderboardPfp3 from '../../assets/rubberbandz.png';

interface ChallengeIntroProps {
  onComplete: () => void;
  initialStep?: number; 
}

const ChallengeIntro: React.FC<ChallengeIntroProps> = ({ 
  onComplete, 
  initialStep = 0  
}) => {
  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  const [animationStarted, setAnimationStarted] = useState<boolean>(false);
  const [xpCount, setXpCount] = useState<number>(0);
  const xpAnimationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const xpPopupsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setCurrentStep(initialStep);
  }, [initialStep]);

  useEffect(() => {
    if (currentStep === 0) {
      const timer = setTimeout(() => {
        setAnimationStarted(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimationStarted(false);
    }
  }, [currentStep]);



  useEffect(() => {
    if (currentStep === 1) {
      setXpCount(0);
      
      const counterInterval = setInterval(() => {
        setXpCount(prev => {
          if (prev >= 150) {
            clearInterval(counterInterval);
            return 150;
          }
          return prev + 10;
        });
      }, 500);
      
      xpAnimationRef.current = setInterval(() => {
        if (xpPopupsRef.current) {
          const popup = document.createElement('div');
          popup.className = 'xp-popup';
          popup.textContent = '+10 XP';
          
          const randomOffset = Math.random() * 60 - 30;
          popup.style.left = `calc(50% + ${randomOffset}px)`;
          popup.style.top = '30px';
          
          popup.style.animation = 'xpFadeUp 1.5s forwards';
          
          xpPopupsRef.current.appendChild(popup);
          
          setTimeout(() => {
            popup.remove();
          }, 1500);
        }
      }, 500);
      
      return () => {
        clearInterval(counterInterval);
        if (xpAnimationRef.current) {
          clearInterval(xpAnimationRef.current);
        }
      };
    }
    
    if (currentStep === 2) {
      const createConfetti = () => {
        if (!xpPopupsRef.current) return;
        
        const confettiContainer = document.querySelector('.rewards-stage');
        if (!confettiContainer) return;
        
        for (let i = 0; i < 30; i++) {
          setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            
            const colors = ['#aaaecf', '#9a9ec7', '#FFD700', '#ffffff', '#7f82ac'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            const randomLeft = Math.random() * 100;
            const randomDelay = Math.random() * 1.5;
            const randomRotation = Math.random() * 360;
            
            confetti.style.left = `${randomLeft}%`;
            confetti.style.backgroundColor = randomColor;
            confetti.style.animationDelay = `${randomDelay}s`;
            confetti.style.transform = `rotate(${randomRotation}deg)`;
            
            confettiContainer.appendChild(confetti);
            
            setTimeout(() => {
              confetti.remove();
            }, 2000 + (randomDelay * 1000));
          }, i * 100);
        }
      };
      
      const createParticles = () => {
        if (!xpPopupsRef.current) return;
        
        const particleContainer = document.querySelector('.rewards-stage');
        if (!particleContainer) return;
        
        const particleInterval = setInterval(() => {
          const particle = document.createElement('div');
          particle.className = 'particle';
          
          const randomLeft = 25 + (Math.random() * 50); 
          const randomXOffset = (Math.random() * 40) - 20;
          const randomDelay = Math.random() * 0.5;
          const randomDuration = 0.5 + (Math.random() * 1);
          
          particle.style.left = `${randomLeft}%`;
          particle.style.bottom = '40px';
          particle.style.setProperty('--x-offset', `${randomXOffset}px`);
          particle.style.animation = `particleAnimation ${randomDuration}s forwards`;
          particle.style.animationDelay = `${randomDelay}s`;
          
          particleContainer.appendChild(particle);
          
          setTimeout(() => {
            particle.remove();
          }, (randomDelay + randomDuration) * 1000);
        }, 200);
        
        const sparkInterval = setInterval(() => {
          const spark = document.createElement('div');
          spark.className = 'spark';
          
          const randomLeft = 47 + (Math.random() * 6);
          const randomAngle = Math.random() * 360;
          
          spark.style.left = `${randomLeft}%`;
          spark.style.bottom = '60px';
          spark.style.transform = `rotate(${randomAngle}deg)`;
          spark.style.animation = `sparkAnimation ${0.5 + (Math.random() * 0.5)}s forwards`;
          
          particleContainer.appendChild(spark);
          
          setTimeout(() => {
            spark.remove();
          }, 1000);
        }, 300);
        
        return () => {
          clearInterval(particleInterval);
          clearInterval(sparkInterval);
        };
      };
      
      setTimeout(createConfetti, 500);
      const cleanupParticles = createParticles();
      
      return () => {
        if (cleanupParticles) cleanupParticles();
      };
    }
  }, [currentStep]);

  const steps = [
    {
      title: t("precisionMatters"),
      description: t("placeYourBids"),
      image: part1image,
    },
    {
      title: t("earnXp"),
      description: t("midsGiveYou"),
      image: "/assets/earn-xp.jpg",
    },
    {
      title: t("claimRewards"),
      description: t("competeOnLeaderboards"),
      image: "/assets/rewards.jpg",
    }
  ];
  
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prevStep => prevStep + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prevStep => prevStep - 1);
    }
  };


  return (
    <div className="account-setup-overlay">
      <div className="account-setup-container challenge-intro-container">
        <div className="account-setup-header">
          <div className="account-setup-title-wrapper">
            <h2 className="account-setup-title">{t("challengeOverview")}</h2>
            <p className="account-setup-subtitle">{t("learnHowToCompete")}</p>
          </div>
          
          <div className="step-indicators">
            {steps.map((_, index) => (
              <div 
                key={index}
                className={`step-indicator ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              />
            ))}
          </div>
        </div>
        
        <div className="challenge-intro-content">
          {currentStep === 0 ? (
            <div className="intro-image-container">
              <div className={`zoom-container ${animationStarted ? 'zoom-active' : ''}`}>
                <img
                  src={steps[currentStep].image}
                  alt={`Step ${currentStep + 1}`}
                  className="intro-image"
                />
                {animationStarted && <div className="glowing-rectangle"></div>}
              </div>
            </div>
          ) : currentStep === 1 ? (
            <div className="xp-animation-container" ref={xpPopupsRef}>
              <div className="user-profile">
                <img
                  src={defaultProfilePic}
                  alt="Profile"
                  className="profile-pic-second"
                />
                <div className="username-display">@player123</div>
                <div className="xp-counter">{xpCount} XP</div>
              </div>
            </div>
          ) : (
            <div className="rewards-container">
              <div className="rewards-stage">
                <div className="podium">
                  <div className="podium-step">
                    <span className="podium-rank">2nd</span>
                  </div>
                  <div className="podium-step">
                    <span className="podium-rank">1st</span>
                  </div>
                  <div className="podium-step">
                    <span className="podium-rank">3rd</span>
                  </div>
                </div>
                
                <div className="podium-profiles">
                  <div className="podium-profile profile-second">
                    <div className="mon-reward">+30 MON</div>
                    <img src={LeaderboardPfp2} alt="2nd Place" className="podium-profile-pic" />
                  </div>
                  <div className="podium-profile profile-first">
                    <div className="mon-reward">+50 MON</div>
                    <img src={defaultProfilePic} alt="1st Place" className="podium-profile-pic" />
                    <div className="crown">👑</div>
                  </div>
                  <div className="podium-profile profile-third">
                    <div className="mon-reward">+20 MON</div>
                    <img src={LeaderboardPfp3} alt="3rd Place" className="podium-profile-pic" />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="intro-text">
            <h3 className="intro-title">
              {steps[currentStep].title}
            </h3>
            <p className="intro-description">
              {steps[currentStep].description}
            </p>
          </div>
        </div>
        
        <div className="account-setup-footer">
          {currentStep > 0 ? (
            <button className="back-button" onClick={handleBack}>
              {t("back")}
            </button>
          ) : (
            <button 
              className="skip-button"
              onClick={onComplete}
            >
              {t("skip")}
            </button>
          )}
          
          <button 
            className="next-button"
            onClick={handleNext}
          >
            {currentStep < steps.length - 1 ? t("next") : t("getStarted")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChallengeIntro;