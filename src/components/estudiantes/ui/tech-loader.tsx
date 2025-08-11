'use client';

import styled from 'styled-components';

const TechLoader = () => {
  return (
    <StyledWrapper>
      <div className="svg-frame">
        <svg style={{ ['--i' as string]: 0, ['--j' as string]: 0 }}>
          <g id="out1">
            <path d="M72 172C72 116.772 116.772 72 172 72C227.228 72 272 116.772 272 172C272 227.228 227.228 272 172 272C116.772 272 72 227.228 72 172ZM197.322 172C197.322 158.015 185.985 146.678 172 146.678C158.015 146.678 146.678 158.015 146.678 172C146.678 185.985 158.015 197.322 172 197.322C185.985 197.322 197.322 185.985 197.322 172Z" />
            <path
              mask="url(#path-1-inside-1_111_3212)"
              strokeMiterlimit={16}
              strokeWidth={2}
              stroke="#00FFFF"
              d="M72 172C72 116.772 116.772 72 172 72C227.228 72 272 116.772 272 172C272 227.228 227.228 272 172 272C116.772 272 72 227.228 72 172ZM197.322 172C197.322 158.015 185.985 146.678 172 146.678C158.015 146.678 146.678 158.015 146.678 172C146.678 185.985 158.015 197.322 172 197.322C185.985 197.322 197.322 185.985 197.322 172Z"
            />
          </g>
        </svg>
        <svg style={{ ['--i' as string]: 1, ['--j' as string]: 1 }}>
          <g id="out2">{/* ...existing out2 path data... */}</g>
        </svg>
        <svg style={{ ['--i' as string]: 0, ['--j' as string]: 2 }}>
          <g id="inner3">{/* ...existing inner3 path data... */}</g>
          <path
            stroke="#00FFFF"
            d="M240.944 172C240.944 187.951 235.414 203.408 225.295 215.738C215.176 228.068 201.095 236.508 185.45 239.62C169.806 242.732 153.567 240.323 139.5 232.804C125.433 225.285 114.408 213.12 108.304 198.384C102.2 183.648 101.394 167.25 106.024 151.987C110.654 136.723 120.434 123.537 133.696 114.675C146.959 105.813 162.884 101.824 178.758 103.388C194.632 104.951 209.472 111.97 220.751 123.249"
            id="out3"
          />
        </svg>
        <svg style={{ ['--i' as string]: 2, ['--j' as string]: 4 }}>
          <path
            fill="#00FFFF"
            d="M180.956 186.056C183.849 184.212 186.103 181.521 187.41 178.349C188.717 175.177 189.013 171.679 188.258 168.332C187.503 164.986 185.734 161.954 183.192 159.65C180.649 157.346 177.458 155.883 174.054 155.46C170.649 155.038 167.197 155.676 164.169 157.288C161.14 158.9 158.683 161.407 157.133 164.468C155.582 167.528 155.014 170.992 155.505 174.388C155.997 177.783 157.524 180.944 159.879 183.439L161.129 182.259C159.018 180.021 157.648 177.186 157.207 174.141C156.766 171.096 157.276 167.989 158.667 165.245C160.057 162.5 162.261 160.252 164.977 158.806C167.693 157.36 170.788 156.788 173.842 157.167C176.895 157.546 179.757 158.858 182.037 160.924C184.317 162.99 185.904 165.709 186.581 168.711C187.258 171.712 186.992 174.849 185.82 177.694C184.648 180.539 182.627 182.952 180.032 184.606L180.956 186.056Z"
            id="center1"
          />
          <path
            fill="#00FFFF"
            d="M172 166.445C175.068 166.445 177.556 168.932 177.556 172C177.556 175.068 175.068 177.556 172 177.556C168.932 177.556 166.444 175.068 166.444 172C166.444 168.932 168.932 166.445 172 166.445ZM172 177.021C174.773 177.021 177.021 174.773 177.021 172C177.021 169.227 174.773 166.979 172 166.979C169.227 166.979 166.979 169.227 166.979 172C166.979 174.773 169.227 177.021 172 177.021Z"
            id="center"
          />
        </svg>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .svg-frame {
    position: relative;
    width: 300px;
    height: 300px;
    transform-style: preserve-3d;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .svg-frame svg {
    position: absolute;
    transition: 0.5s;
    z-index: calc(1 - (0.2 * var(--j)));
    transform-origin: center;
    width: 344px;
    height: 344px;
    fill: none;
  }

  .svg-frame:hover svg {
    transform: rotate(-80deg) skew(30deg) translateX(calc(45px * var(--i)))
      translateY(calc(-35px * var(--i)));
  }

  .svg-frame svg #center {
    transition: 0.5s;
    transform-origin: center;
  }

  .svg-frame:hover svg #center {
    transform: rotate(-30deg) translateX(45px) translateY(-3px);
  }

  #out2 {
    animation: rotate16 7s ease-in-out infinite alternate;
    transform-origin: center;
  }

  #out3 {
    animation: rotate16 3s ease-in-out infinite alternate;
    transform-origin: center;
    stroke: #ff0;
  }

  #inner3,
  #inner1 {
    animation: rotate16 4s ease-in-out infinite alternate;
    transform-origin: center;
  }

  #center1 {
    fill: #ff0;
    animation: rotate16 2s ease-in-out infinite alternate;
    transform-origin: center;
  }

  @keyframes rotate16 {
    to {
      transform: rotate(360deg);
    }
  }
`;

export default TechLoader;
