class AlertLog(Base):
    """Records every alert dispatch (even dry-run ones) so admin
    analytics has real activity data, not just print statements."""
    __tablename__ = "alert_log"

    id = Column(String, primary_key=True, default=_uuid)
    zone_name = Column(String, nullable=False)
    hazard_type = Column(String, nullable=False)
    status = Column(String, nullable=False)
    recipients_count = Column(Integer, default=0)
    email_sent_count = Column(Integer, default=0)
    sms_sent_count = Column(Integer, default=0)
    sent_at = Column(DateTime, default=datetime.utcnow)