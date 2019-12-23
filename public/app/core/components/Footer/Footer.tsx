import React, { FC } from 'react';
import { Tooltip } from '@grafana/ui';

interface Props {
  appName: string;
  buildVersion: string;
  buildCommit: string;
  newGrafanaVersionExists: boolean;
  newGrafanaVersion: string;
}

export const Footer: FC<Props> = React.memo(
  ({ appName, buildVersion, buildCommit, newGrafanaVersionExists, newGrafanaVersion }) => {
    return (
      <footer className="footer">
        <div className="text-center">
          <span>
            Copyright &copy; {new Date().getFullYear()}-{new Date().getFullYear() + 1} 杭州辰栖科技有限公司 保留所有权利
          </span>
          <ul className="display-none">
            <li>
              <a href="http://docs.grafana.org" target="_blank">
                <i className="fa fa-file-code-o" /> Docs
              </a>
            </li>
            <li>
              <a href="https://grafana.com/services/support" target="_blank">
                <i className="fa fa-support" /> Support Plans
              </a>
            </li>
            <li>
              <a href="https://community.grafana.com/" target="_blank">
                <i className="fa fa-comments-o" /> Community
              </a>
            </li>
            <li>
              <a href="https://grafana.com" target="_blank">
                {appName}
              </a>{' '}
              <span>
                v{buildVersion} (commit: {buildCommit})
              </span>
            </li>
            {newGrafanaVersionExists && (
              <li>
                <Tooltip placement="auto" content={newGrafanaVersion}>
                  <a href="https://grafana.com/get" target="_blank">
                    New version available!
                  </a>
                </Tooltip>
              </li>
            )}
          </ul>
        </div>
      </footer>
    );
  }
);

export default Footer;
